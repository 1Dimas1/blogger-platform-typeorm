import { Injectable } from '@nestjs/common';
import { PostViewDto, LikeDetailsViewDto } from '../api/view-dto/post.view-dto';
import { GetPostsQueryParams } from '../api/input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { LikeStatus } from '../../likes/domain/like.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DbService } from '../../../../db/db.service';

@Injectable()
export class PostsQueryRepository {
  constructor(private dbService: DbService) {}

  private getSortColumn(sortBy: string): string {
    const sortColumnMap: Record<string, string> = {
      createdAt: 'p.created_at',
      title: 'p.title',
      shortDescription: 'p.short_description',
      content: 'p.content',
      blogName: 'p.blog_name',
      blogId: 'p.blog_id',
    };
    return sortColumnMap[sortBy] || 'p.created_at';
  }

  async getByIdOrNotFoundFail(
    id: string,
    userId?: string | null,
  ): Promise<PostViewDto> {
    const params: any[] = [id];
    let myStatusSelect: string;

    if (userId) {
      myStatusSelect = `COALESCE(
        (SELECT l.status FROM likes l WHERE l.parent_id = p.id AND l.parent_type = 'post' AND l.user_id = $2),
        '${LikeStatus.None}'
      ) as my_status`;
      params.push(userId);
    } else {
      myStatusSelect = `'${LikeStatus.None}' as my_status`;
    }

    const result = await this.dbService.query(
      `SELECT p.*, ${myStatusSelect}
       FROM posts p
       WHERE p.id = $1 AND p.deleted_at IS NULL`,
      params,
    );

    if (result.rows.length === 0) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'post not found',
      });
    }

    const row = result.rows[0];
    const newestLikes = await this.getNewestLikesForPost(row.id);

    return PostViewDto.mapToView(row, row.my_status, newestLikes);
  }

  async getAll(
    query: GetPostsQueryParams,
    userId?: string | null,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this._getPostsPaginated('p.deleted_at IS NULL', [], query, userId);
  }

  async getAllByBlogId(
    blogId: string,
    query: GetPostsQueryParams,
    userId?: string | null,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this._getPostsPaginated(
      'p.blog_id = $1 AND p.deleted_at IS NULL',
      [blogId],
      query,
      userId,
    );
  }

  private async _getPostsPaginated(
    whereClause: string,
    whereParams: any[],
    query: GetPostsQueryParams,
    userId?: string | null,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const sortColumn = this.getSortColumn(query.sortBy);
    const sortDir = query.sortDirection.toUpperCase();

    let paramIndex = whereParams.length + 1;

    let myStatusSelect: string;
    const selectParams = [...whereParams];

    if (userId) {
      myStatusSelect = `COALESCE(
        (SELECT l.status FROM likes l WHERE l.parent_id = p.id AND l.parent_type = 'post' AND l.user_id = $${paramIndex}),
        '${LikeStatus.None}'
      ) as my_status`;
      selectParams.push(userId);
      paramIndex++;
    } else {
      myStatusSelect = `'${LikeStatus.None}' as my_status`;
    }

    const countResult = await this.dbService.query(
      `SELECT COUNT(*) FROM posts p WHERE ${whereClause}`,
      whereParams,
    );
    const totalCount = parseInt(countResult.rows[0].count);

    const dataResult = await this.dbService.query(
      `SELECT p.*, ${myStatusSelect}
       FROM posts p
       WHERE ${whereClause}
       ORDER BY ${sortColumn} ${sortDir}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...selectParams, query.pageSize, query.calculateSkip()],
    );

    const postIds = dataResult.rows.map((row: any) => row.id);
    const newestLikesMap = await this.getNewestLikesForPosts(postIds);

    const items: PostViewDto[] = dataResult.rows.map((row: any) =>
      PostViewDto.mapToView(
        row,
        row.my_status || LikeStatus.None,
        newestLikesMap.get(row.id) || [],
      ),
    );

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  private async getNewestLikesForPost(
    postId: string,
  ): Promise<LikeDetailsViewDto[]> {
    const result = await this.dbService.query(
      `SELECT l.created_at as added_at, l.user_id, u.login
       FROM likes l
       JOIN users u ON u.id = l.user_id
       WHERE l.parent_id = $1 AND l.parent_type = 'post' AND l.status = 'Like'
       ORDER BY l.created_at DESC
       LIMIT 3`,
      [postId],
    );

    return result.rows.map((row: any) => ({
      addedAt: new Date(row.added_at).toISOString(),
      userId: row.user_id,
      login: row.login,
    }));
  }

  private async getNewestLikesForPosts(
    postIds: string[],
  ): Promise<Map<string, LikeDetailsViewDto[]>> {
    const map = new Map<string, LikeDetailsViewDto[]>();
    if (postIds.length === 0) return map;

    const result = await this.dbService.query(
      `SELECT DISTINCT ON (ranked.parent_id, ranked.rn)
              ranked.parent_id, ranked.added_at, ranked.user_id, ranked.login
       FROM (
         SELECT l.parent_id, l.created_at as added_at, l.user_id, u.login,
                ROW_NUMBER() OVER (PARTITION BY l.parent_id ORDER BY l.created_at DESC) as rn
         FROM likes l
         JOIN users u ON u.id = l.user_id
         WHERE l.parent_id = ANY($1) AND l.parent_type = 'post' AND l.status = 'Like'
       ) ranked
       WHERE ranked.rn <= 3
       ORDER BY ranked.parent_id, ranked.rn`,
      [postIds],
    );

    for (const row of result.rows) {
      const postId = row.parent_id;
      if (!map.has(postId)) {
        map.set(postId, []);
      }
      map.get(postId)!.push({
        addedAt: new Date(row.added_at).toISOString(),
        userId: row.user_id,
        login: row.login,
      });
    }

    return map;
  }
}
