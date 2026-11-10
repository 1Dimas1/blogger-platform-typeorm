import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { GetCommentsQueryParams } from '../api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { LikeStatus } from '../../likes/domain/like.entity';
import { CommentLike } from '../../likes/domain/comment-like.entity';
import {
  CommentRawRow,
  CommentViewDto,
} from '../api/view-dto/comment.view-dto';
import { Comment } from '../domain/comment.entity';

const sortColumnMap: Record<string, string> = {
  createdAt: 'c.createdAt',
  content: 'c.content',
};

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectRepository(Comment) private commentsRepo: Repository<Comment>,
  ) {}

  async getByIdOrNotFoundFail(
    id: string,
    userId?: string | null,
  ): Promise<CommentViewDto> {
    const row = await this.buildCommentsQuery(userId)
      .where('c.id = :id', { id })
      .getRawOne<CommentRawRow>();

    if (!row) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'comment not found',
      });
    }

    return CommentViewDto.mapToView(row);
  }

  async getAllByPostId(
    postId: string,
    query: GetCommentsQueryParams,
    userId?: string | null,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const sortColumn = sortColumnMap[query.sortBy] ?? sortColumnMap.createdAt;
    const sortDirection =
      query.sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.buildCommentsQuery(userId).where('c.postId = :postId', {
      postId,
    });

    const [rows, totalCount] = await Promise.all([
      qb
        .clone()
        .orderBy(sortColumn, sortDirection)
        .offset(query.calculateSkip())
        .limit(query.pageSize)
        .getRawMany<CommentRawRow>(),
      qb.getCount(),
    ]);

    return PaginatedViewDto.mapToView({
      items: rows.map(CommentViewDto.mapToView),
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  /**
   * Comments with commentator login, like/dislike counters and the user's own status.
   * withDeleted() keeps the login of a soft-deleted commentator.
   */
  private buildCommentsQuery(
    userId?: string | null,
  ): SelectQueryBuilder<Comment> {
    const qb = this.commentsRepo
      .createQueryBuilder('c')
      .withDeleted()
      .innerJoin('c.commentator', 'u')
      .select('c.id', 'id')
      .addSelect('c.content', 'content')
      .addSelect('c.commentatorUserId', 'commentatorUserId')
      .addSelect('u.login', 'commentatorUserLogin')
      .addSelect('c.createdAt', 'createdAt')
      .addSelect(
        (sq) =>
          sq
            .select('COUNT(*)')
            .from(CommentLike, 'cl')
            .where('cl.commentId = c.id')
            .andWhere('cl.status = :like'),
        'likesCount',
      )
      .addSelect(
        (sq) =>
          sq
            .select('COUNT(*)')
            .from(CommentLike, 'cl')
            .where('cl.commentId = c.id')
            .andWhere('cl.status = :dislike'),
        'dislikesCount',
      )
      .setParameters({ like: LikeStatus.Like, dislike: LikeStatus.Dislike });

    if (userId) {
      qb.addSelect(
        (sq) =>
          sq
            .select('cl.status')
            .from(CommentLike, 'cl')
            .where('cl.commentId = c.id')
            .andWhere('cl.userId = :userId'),
        'myStatus',
      ).setParameter('userId', userId);
    } else {
      qb.addSelect('NULL', 'myStatus');
    }

    return qb;
  }
}
