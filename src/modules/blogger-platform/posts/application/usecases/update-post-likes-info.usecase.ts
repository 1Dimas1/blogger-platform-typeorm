import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostDocument } from '../../domain/post.entity';

export class UpdatePostLikesInfoCommand {
  constructor(
    public postId: string,
    public likesCount: number,
    public dislikesCount: number,
  ) {}
}

@CommandHandler(UpdatePostLikesInfoCommand)
export class UpdatePostLikesInfoUseCase
  implements ICommandHandler<UpdatePostLikesInfoCommand, void>
{
  constructor(private postsRepository: PostsRepository) {}

  async execute({
    postId,
    likesCount,
    dislikesCount,
  }: UpdatePostLikesInfoCommand): Promise<void> {
    const post: PostDocument =
      await this.postsRepository.findOrNotFoundFail(postId);

    post.updateLikesInfo(likesCount, dislikesCount);

    await this.postsRepository.save(post);
  }
}
