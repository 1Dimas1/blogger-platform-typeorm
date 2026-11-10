import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { CommentsFactory } from '../factories/comments.factory';
import { CreateCommentDto } from '../../dto/create-comment.dto';
import { CommentDocument } from '../../domain/comment.entity';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { UsersExternalQueryRepository } from '../../../../user-accounts/infrastructure/external-query/users.external-query-repository';
import { UserExternalDto } from '../../../../user-accounts/infrastructure/external-query/external-dto/users.external-dto';

export class CreateCommentCommand {
  constructor(
    public postId: string,
    public dto: CreateCommentDto,
    public userId: string,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand, string>
{
  constructor(
    private commentsRepository: CommentsRepository,
    private commentsFactory: CommentsFactory,
    private postsRepository: PostsRepository,
    private usersExternalQueryRepository: UsersExternalQueryRepository,
  ) {}

  async execute({
    postId,
    dto,
    userId,
  }: CreateCommentCommand): Promise<string> {
    await this.postsRepository.findOrNotFoundFail(postId);

    const user: UserExternalDto =
      await this.usersExternalQueryRepository.getByIdOrNotFoundFail(userId);
    const userLogin: string = user.login;

    const comment: CommentDocument = await this.commentsFactory.create({
      content: dto.content,
      userId,
      userLogin,
      postId,
    });

    await this.commentsRepository.save(comment);

    return comment.id;
  }
}
