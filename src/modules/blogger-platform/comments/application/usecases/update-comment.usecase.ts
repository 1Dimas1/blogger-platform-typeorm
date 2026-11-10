import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { UpdateCommentDto } from '../../dto/update-comment.dto';
import { CommentDocument } from '../../domain/comment.entity';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdateCommentCommand {
  constructor(
    public id: string,
    public dto: UpdateCommentDto,
    public userId: string,
  ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase
  implements ICommandHandler<UpdateCommentCommand, void>
{
  constructor(private commentsRepository: CommentsRepository) {}

  async execute({ id, dto, userId }: UpdateCommentCommand): Promise<void> {
    const comment: CommentDocument =
      await this.commentsRepository.findOrNotFoundFail(id);

    if (!comment.isOwnedBy(userId)) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You can only edit your own comments',
      });
    }

    comment.update(dto);

    await this.commentsRepository.save(comment);
  }
}
