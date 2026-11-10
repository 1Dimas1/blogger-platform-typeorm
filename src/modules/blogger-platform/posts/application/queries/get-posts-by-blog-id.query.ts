import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostsQueryRepository } from '../../infrastructure/posts.query-repository';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { BlogsRepository } from '../../../blogs/infrastructure/blogs.repository';

export class GetPostsByBlogIdQuery {
  constructor(
    public blogId: string,
    public queryParams: GetPostsQueryParams,
    public userId: string | null,
  ) {}
}

@QueryHandler(GetPostsByBlogIdQuery)
export class GetPostsByBlogIdQueryHandler
  implements
    IQueryHandler<GetPostsByBlogIdQuery, PaginatedViewDto<PostViewDto[]>>
{
  constructor(
    private postsQueryRepository: PostsQueryRepository,
    private blogsRepository: BlogsRepository,
  ) {}

  async execute(
    query: GetPostsByBlogIdQuery,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    await this.blogsRepository.findOrNotFoundFail(query.blogId);

    return this.postsQueryRepository.getAllByBlogId(
      query.blogId,
      query.queryParams,
      query.userId,
    );
  }
}
