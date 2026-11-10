import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { BlogsRepository } from '../../../blogs/infrastructure/blogs.repository';
import { UpdatePostDto } from '../../dto/update-post.dto';
import { PostDocument } from '../../domain/post.entity';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdatePostByBlogIdCommand {
  constructor(
    public blogId: string,
    public postId: string,
    public dto: UpdatePostDto,
  ) {}
}

@CommandHandler(UpdatePostByBlogIdCommand)
export class UpdatePostByBlogIdUseCase
  implements ICommandHandler<UpdatePostByBlogIdCommand, void>
{
  constructor(
    private postsRepository: PostsRepository,
    private blogsRepository: BlogsRepository,
  ) {}

  async execute({
    blogId,
    postId,
    dto,
  }: UpdatePostByBlogIdCommand): Promise<void> {
    await this.blogsRepository.findOrNotFoundFail(blogId);

    const post: PostDocument =
      await this.postsRepository.findOrNotFoundFail(postId);

    if (post.blogId !== blogId) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'post not found',
      });
    }

    post.update(dto);

    await this.postsRepository.save(post);
  }
}
