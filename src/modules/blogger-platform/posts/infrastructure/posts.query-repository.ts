import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  PostViewDto,
  LikeDetailsViewDto,
  PostRawRow,
} from '../api/view-dto/post.view-dto';
import { GetPostsQueryParams } from '../api/input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { LikeStatus } from '../../likes/domain/like.entity';
import { PostLike } from '../../likes/domain/post-like.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Post } from '../domain/post.entity';

const NEWEST_LIKES_COUNT = 3;

const sortColumnMap: Record<string, string> = {
  createdAt: 'p.createdAt',
  title: 'p.title',
  shortDescription: 'p.shortDescription',
  content: 'p.content',
  blogName: 'b.name',
  blogId: 'p.blogId',
};

type NewestLikeRawRow = {
  postId: string;
  addedAt: Date;
  userId: string;
  login: string;
};

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectRepository(Post) private postsRepo: Repository<Post>,
    @InjectRepository(PostLike) private postLikesRepo: Repository<PostLike>,
  ) {}

  async getByIdOrNotFoundFail(
    id: string,
    userId?: string | null,
  ): Promise<PostViewDto> {
    const row = await this.buildPostsQuery(userId)
      .andWhere('p.id = :id', { id })
      .getRawOne<PostRawRow>();

    if (!row) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'post not found',
      });
    }

    const newestLikesMap = await this.getNewestLikes([row.id]);

    return PostViewDto.mapToView(row, newestLikesMap.get(row.id));
  }

  async getAll(
    query: GetPostsQueryParams,
    userId?: string | null,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.getPostsPaginated(query, userId);
  }

  async getAllByBlogId(
    blogId: string,
    query: GetPostsQueryParams,
    userId?: string | null,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.getPostsPaginated(query, userId, blogId);
  }

  private async getPostsPaginated(
    query: GetPostsQueryParams,
    userId?: string | null,
    blogId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const sortColumn = sortColumnMap[query.sortBy] ?? sortColumnMap.createdAt;
    const sortDirection =
      query.sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.buildPostsQuery(userId);
    if (blogId) {
      qb.andWhere('p.blogId = :blogId', { blogId });
    }

    const [rows, totalCount] = await Promise.all([
      qb
        .clone()
        .orderBy(sortColumn, sortDirection)
        .offset(query.calculateSkip())
        .limit(query.pageSize)
        .getRawMany<PostRawRow>(),
      qb.getCount(),
    ]);

    const newestLikesMap = await this.getNewestLikes(rows.map((r) => r.id));

    return PaginatedViewDto.mapToView({
      items: rows.map((row) =>
        PostViewDto.mapToView(row, newestLikesMap.get(row.id)),
      ),
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  /**
   * Non-deleted posts with blog name, like/dislike counters and the user's own status.
   * withDeleted() keeps the blog join working for soft-deleted blogs; post deletion is filtered explicitly.
   */
  private buildPostsQuery(userId?: string | null): SelectQueryBuilder<Post> {
    const qb = this.postsRepo
      .createQueryBuilder('p')
      .withDeleted()
      .innerJoin('p.blog', 'b')
      .select('p.id', 'id')
      .addSelect('p.title', 'title')
      .addSelect('p.shortDescription', 'shortDescription')
      .addSelect('p.content', 'content')
      .addSelect('p.blogId', 'blogId')
      .addSelect('b.name', 'blogName')
      .addSelect('p.createdAt', 'createdAt')
      .addSelect(
        (sq) =>
          sq
            .select('COUNT(*)')
            .from(PostLike, 'pl')
            .where('pl.postId = p.id')
            .andWhere('pl.status = :like'),
        'likesCount',
      )
      .addSelect(
        (sq) =>
          sq
            .select('COUNT(*)')
            .from(PostLike, 'pl')
            .where('pl.postId = p.id')
            .andWhere('pl.status = :dislike'),
        'dislikesCount',
      )
      .where('p.deletedAt IS NULL')
      .setParameters({ like: LikeStatus.Like, dislike: LikeStatus.Dislike });

    if (userId) {
      qb.addSelect(
        (sq) =>
          sq
            .select('pl.status')
            .from(PostLike, 'pl')
            .where('pl.postId = p.id')
            .andWhere('pl.userId = :userId'),
        'myStatus',
      ).setParameter('userId', userId);
    } else {
      qb.addSelect('NULL', 'myStatus');
    }

    return qb;
  }

  // 3 latest "Like" reactions per post, one query for the whole page (ROW_NUMBER per post)
  private async getNewestLikes(
    postIds: string[],
  ): Promise<Map<string, LikeDetailsViewDto[]>> {
    const map = new Map<string, LikeDetailsViewDto[]>();
    if (postIds.length === 0) return map;

    const ranked = this.postLikesRepo
      .createQueryBuilder('l')
      .withDeleted()
      .innerJoin('l.user', 'u')
      .select('l.postId', 'postId')
      .addSelect('l.createdAt', 'addedAt')
      .addSelect('l.userId', 'userId')
      .addSelect('u.login', 'login')
      .addSelect(
        'ROW_NUMBER() OVER (PARTITION BY l.post_id ORDER BY l.created_at DESC)',
        'rn',
      )
      .where('l.postId IN (:...postIds)', { postIds })
      .andWhere('l.status = :like', { like: LikeStatus.Like });

    const rows: NewestLikeRawRow[] = await this.postLikesRepo.manager
      .createQueryBuilder()
      .select('r.*')
      .from(`(${ranked.getQuery()})`, 'r')
      .where('r.rn <= :limit', { limit: NEWEST_LIKES_COUNT })
      .orderBy('r."addedAt"', 'DESC')
      .setParameters(ranked.getParameters())
      .getRawMany();

    for (const row of rows) {
      const likes = map.get(row.postId) ?? [];
      likes.push({
        addedAt: new Date(row.addedAt).toISOString(),
        userId: row.userId,
        login: row.login,
      });
      map.set(row.postId, likes);
    }

    return map;
  }
}
