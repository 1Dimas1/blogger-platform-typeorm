import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostsFactory } from '../factories/posts.factory';
import { CreatePostDto } from '../../dto/create-post.dto';
import { PostDocument } from '../../domain/post.entity';

export class CreatePostCommand {
  constructor(public dto: CreatePostDto) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase
  implements ICommandHandler<CreatePostCommand, string>
{
  constructor(
    private postsRepository: PostsRepository,
    private postsFactory: PostsFactory,
  ) {}

  async execute({ dto }: CreatePostCommand): Promise<string> {
    const post: PostDocument = await this.postsFactory.create({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
    });

    await this.postsRepository.save(post);

    return post.id;
  }
}
