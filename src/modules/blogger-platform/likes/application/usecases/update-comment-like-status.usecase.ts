import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeDto } from '../../dto/like.dto';
import { LikesRepository } from '../../infrastructure/likes.repository';
import { CommentsRepository } from '../../../comments/infrastructure/comments.repository';
import { LikesFactory } from '../factories/likes.factory';
import { LikeDocument } from '../../domain/like.entity';

export class UpdateCommentLikeStatusCommand {
  constructor(
    public commentId: string,
    public dto: LikeDto,
    public userId: string,
  ) {}
}

@CommandHandler(UpdateCommentLikeStatusCommand)
export class UpdateCommentLikeStatusUseCase
  implements ICommandHandler<UpdateCommentLikeStatusCommand, void>
{
  constructor(
    private likesFactory: LikesFactory,
    private likesRepository: LikesRepository,
    private commentsRepository: CommentsRepository,
  ) {}

  async execute({
    commentId,
    dto,
    userId,
  }: UpdateCommentLikeStatusCommand): Promise<void> {
    await this.commentsRepository.findOrNotFoundFail(commentId);

    const existingLike: LikeDocument | null =
      await this.likesRepository.findByUserAndParent(
        userId,
        commentId,
        'comment',
      );

    if (existingLike) {
      if (existingLike.status === dto.likeStatus) {
        return;
      }
      existingLike.updateStatus(dto.likeStatus);
      await this.likesRepository.save(existingLike);
    } else {
      const like: LikeDocument = this.likesFactory.create({
        userId,
        parentId: commentId,
        parentType: 'comment',
        status: dto.likeStatus,
      });

      await this.likesRepository.save(like);
    }
  }
}
