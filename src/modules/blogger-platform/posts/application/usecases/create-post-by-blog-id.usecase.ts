import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostsFactory } from '../factories/posts.factory';
import { CreatePostByBlogIdDto } from '../../dto/create-post.dto';
import { PostDocument } from '../../domain/post.entity';

export class CreatePostByBlogIdCommand {
  constructor(
    public blogId: string,
    public dto: CreatePostByBlogIdDto,
  ) {}
}

@CommandHandler(CreatePostByBlogIdCommand)
export class CreatePostByBlogIdUseCase
  implements ICommandHandler<CreatePostByBlogIdCommand, string>
{
  constructor(
    private postsRepository: PostsRepository,
    private postsFactory: PostsFactory,
  ) {}

  async execute({ blogId, dto }: CreatePostByBlogIdCommand): Promise<string> {
    const post: PostDocument = await this.postsFactory.create({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: blogId,
    });

    await this.postsRepository.save(post);

    return post.id;
  }
}
