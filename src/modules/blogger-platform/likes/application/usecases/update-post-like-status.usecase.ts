import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeDto } from '../../dto/like.dto';
import { LikesRepository } from '../../infrastructure/likes.repository';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { LikesFactory } from '../factories/likes.factory';
import { LikeDocument, LikeStatus } from '../../domain/like.entity';
import { UpdatePostLikesInfoCommand } from '../../../posts/application/usecases/update-post-likes-info.usecase';

export class UpdatePostLikeStatusCommand {
  constructor(
    public postId: string,
    public dto: LikeDto,
    public userId: string,
  ) {}
}

@CommandHandler(UpdatePostLikeStatusCommand)
export class UpdatePostLikeStatusUseCase
  implements ICommandHandler<UpdatePostLikeStatusCommand, void>
{
  constructor(
    private likesFactory: LikesFactory,
    private likesRepository: LikesRepository,
    private postsRepository: PostsRepository,
    private commandBus: CommandBus,
  ) {}

  async execute({
    postId,
    dto,
    userId,
  }: UpdatePostLikeStatusCommand): Promise<void> {
    await this.postsRepository.findOrNotFoundFail(postId);

    const existingLike: LikeDocument | null =
      await this.likesRepository.findByUserAndParent(userId, postId, 'post');

    if (existingLike) {
      if (existingLike.status === dto.likeStatus) {
        return;
      }
      existingLike.updateStatus(dto.likeStatus);
      await this.likesRepository.save(existingLike);
    } else {
      const like: LikeDocument = this.likesFactory.create({
        userId,
        parentId: postId,
        parentType: 'post',
        status: dto.likeStatus,
      });

      await this.likesRepository.save(like);
    }

    await this.updatePostLikesInfo(postId);
  }

  private async updatePostLikesInfo(postId: string): Promise<void> {
    const likes: LikeDocument[] = await this.likesRepository.findByParent(
      postId,
      'post',
    );

    const likesCount: number = likes.filter(
      (like) => like.status === LikeStatus.Like,
    ).length;
    const dislikesCount: number = likes.filter(
      (like) => like.status === LikeStatus.Dislike,
    ).length;

    await this.commandBus.execute(
      new UpdatePostLikesInfoCommand(postId, likesCount, dislikesCount),
    );
  }
}
