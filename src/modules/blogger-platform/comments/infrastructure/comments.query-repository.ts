import { Injectable } from '@nestjs/common';
import {
  CommentViewDto,
  LikesInfoViewDto,
} from '../api/view-dto/comment.view-dto';
import { GetCommentsQueryParams } from '../api/input-dto/get-comments-query-params.input-dto';
import { LikeStatus } from '../../likes/domain/like.entity';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DbService } from '../../../../db/db.service';

@Injectable()
export class CommentsQueryRepository {
  constructor(private dbService: DbService) {}

  private getSortColumn(sortBy: string): string {
    const sortColumnMap: Record<string, string> = {
      createdAt: 'c.created_at',
      content: 'c.content',
    };
    return sortColumnMap[sortBy] || 'c.created_at';
  }

  private buildLikesSelect(
    userId: string | null | undefined,
    paramIndex: number,
  ): {
    selectClause: string;
    params: any[];
    nextParamIndex: number;
  } {
    const likesCountSelect = `COALESCE((SELECT COUNT(*) FROM likes l WHERE l.parent_id = c.id AND l.parent_type = 'comment' AND l.status = 'Like'), 0)::int as likes_count`;
    const dislikesCountSelect = `COALESCE((SELECT COUNT(*) FROM likes l WHERE l.parent_id = c.id AND l.parent_type = 'comment' AND l.status = 'Dislike'), 0)::int as dislikes_count`;

    let myStatusSelect: string;
    const params: any[] = [];

    if (userId) {
      myStatusSelect = `COALESCE(
        (SELECT l.status FROM likes l WHERE l.parent_id = c.id AND l.parent_type = 'comment' AND l.user_id = $${paramIndex}),
        '${LikeStatus.None}'
      ) as my_status`;
      params.push(userId);
      paramIndex++;
    } else {
      myStatusSelect = `'${LikeStatus.None}' as my_status`;
    }

    return {
      selectClause: `${likesCountSelect}, ${dislikesCountSelect}, ${myStatusSelect}`,
      params,
      nextParamIndex: paramIndex,
    };
  }

  async getByIdOrNotFoundFail(
    id: string,
    userId?: string | null,
  ): Promise<CommentViewDto> {
    const likes = this.buildLikesSelect(userId, 2);

    const result = await this.dbService.query(
      `SELECT c.*, ${likes.selectClause}
       FROM comments c
       WHERE c.id = $1`,
      [id, ...likes.params],
    );

    if (result.rows.length === 0) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'comment not found',
      });
    }

    const row = result.rows[0];
    const likesInfo: LikesInfoViewDto = {
      likesCount: row.likes_count,
      dislikesCount: row.dislikes_count,
      myStatus: row.my_status as LikeStatus,
    };

    return CommentViewDto.mapToView(row, likesInfo);
  }

  async getAllByPostId(
    postId: string,
    query: GetCommentsQueryParams,
    userId?: string | null,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const sortColumn = this.getSortColumn(query.sortBy);
    const sortDir = query.sortDirection.toUpperCase();

    const countResult = await this.dbService.query(
      `SELECT COUNT(*) FROM comments c WHERE c.post_id = $1`,
      [postId],
    );
    const totalCount = parseInt(countResult.rows[0].count);

    let paramIndex = 2;
    const likes = this.buildLikesSelect(userId, paramIndex);
    paramIndex = likes.nextParamIndex;

    const dataResult = await this.dbService.query(
      `SELECT c.*, ${likes.selectClause}
       FROM comments c
       WHERE c.post_id = $1
       ORDER BY ${sortColumn} ${sortDir}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [postId, ...likes.params, query.pageSize, query.calculateSkip()],
    );

    const items: CommentViewDto[] = dataResult.rows.map((row: any) => {
      const likesInfo: LikesInfoViewDto = {
        likesCount: row.likes_count,
        dislikesCount: row.dislikes_count,
        myStatus: row.my_status as LikeStatus,
      };
      return CommentViewDto.mapToView(row, likesInfo);
    });

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
