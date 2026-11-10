import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeDto } from '../../dto/like.dto';
import { LikesRepository } from '../../infrastructure/likes.repository';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { LikesFactory } from '../factories/likes.factory';
import { PostLikeDocument } from '../../domain/post-like.entity';

export class UpdatePostLikeStatusCommand {
  constructor(
    public postId: string,
    public dto: LikeDto,
    public userId: string,
  ) {}
}

// likes/dislikes counters are not stored on the post; PostsQueryRepository counts post_likes
@CommandHandler(UpdatePostLikeStatusCommand)
export class UpdatePostLikeStatusUseCase
  implements ICommandHandler<UpdatePostLikeStatusCommand, void>
{
  constructor(
    private likesFactory: LikesFactory,
    private likesRepository: LikesRepository,
    private postsRepository: PostsRepository,
  ) {}

  async execute({
    postId,
    dto,
    userId,
  }: UpdatePostLikeStatusCommand): Promise<void> {
    await this.postsRepository.findOrNotFoundFail(postId);

    const existingLike: PostLikeDocument | null =
      await this.likesRepository.findPostLike(userId, postId);

    if (existingLike) {
      if (existingLike.status === dto.likeStatus) {
        return;
      }
      existingLike.updateStatus(dto.likeStatus);
      await this.likesRepository.savePostLike(existingLike);
    } else {
      const like: PostLikeDocument = this.likesFactory.createPostLike({
        userId,
        postId,
        status: dto.likeStatus,
      });

      await this.likesRepository.savePostLike(like);
    }
  }
}
