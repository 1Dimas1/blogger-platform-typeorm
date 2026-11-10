import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { BlogsFactory } from '../factories/blogs.factory';
import { CreateBlogDto } from '../../dto/create-blog.dto';
import { BlogDocument } from '../../domain/blog.entity';

export class CreateBlogCommand {
  constructor(public dto: CreateBlogDto) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase
  implements ICommandHandler<CreateBlogCommand, string>
{
  constructor(
    private blogsRepository: BlogsRepository,
    private blogsFactory: BlogsFactory,
  ) {}

  async execute({ dto }: CreateBlogCommand): Promise<string> {
    const blog: BlogDocument = this.blogsFactory.create(dto);

    await this.blogsRepository.save(blog);

    return blog.id;
  }
}
