import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CommentsQueryRepository } from '../../infrastructure/comments.query-repository';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';

export class GetCommentsByPostIdQuery {
  constructor(
    public postId: string,
    public queryParams: GetCommentsQueryParams,
    public userId: string | null,
  ) {}
}

@QueryHandler(GetCommentsByPostIdQuery)
export class GetCommentsByPostIdQueryHandler
  implements
    IQueryHandler<GetCommentsByPostIdQuery, PaginatedViewDto<CommentViewDto[]>>
{
  constructor(private commentsQueryRepository: CommentsQueryRepository) {}

  async execute(
    query: GetCommentsByPostIdQuery,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    return this.commentsQueryRepository.getAllByPostId(
      query.postId,
      query.queryParams,
      query.userId,
    );
  }
}
