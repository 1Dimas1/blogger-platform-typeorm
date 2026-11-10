import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { BlogsRepository } from '../../../blogs/infrastructure/blogs.repository';
import { PostDocument } from '../../domain/post.entity';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class DeletePostByBlogIdCommand {
  constructor(
    public blogId: string,
    public postId: string,
  ) {}
}

@CommandHandler(DeletePostByBlogIdCommand)
export class DeletePostByBlogIdUseCase
  implements ICommandHandler<DeletePostByBlogIdCommand, void>
{
  constructor(
    private postsRepository: PostsRepository,
    private blogsRepository: BlogsRepository,
  ) {}

  async execute({ blogId, postId }: DeletePostByBlogIdCommand): Promise<void> {
    await this.blogsRepository.findOrNotFoundFail(blogId);

    const post: PostDocument =
      await this.postsRepository.findOrNotFoundFail(postId);

    if (post.blogId !== blogId) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'post not found',
      });
    }

    post.makeDeleted();

    await this.postsRepository.save(post);
  }
}
