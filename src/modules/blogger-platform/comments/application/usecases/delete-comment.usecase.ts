import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { CommentDocument } from '../../domain/comment.entity';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class DeleteCommentCommand {
  constructor(
    public id: string,
    public userId: string,
  ) {}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase
  implements ICommandHandler<DeleteCommentCommand, void>
{
  constructor(private commentsRepository: CommentsRepository) {}

  async execute({ id, userId }: DeleteCommentCommand): Promise<void> {
    const comment: CommentDocument =
      await this.commentsRepository.findOrNotFoundFail(id);

    if (!comment.isOwnedBy(userId)) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You can only delete your own comments',
      });
    }

    await this.commentsRepository.delete(comment);
  }
}
