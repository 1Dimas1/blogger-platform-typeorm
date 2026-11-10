import { Injectable } from '@nestjs/common';
import { Post, PostDocument } from '../../domain/post.entity';
import { BlogsRepository } from '../../../blogs/infrastructure/blogs.repository';
import { BlogDocument } from '../../../blogs/domain/blog.entity';

export interface CreatePostFactoryDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

@Injectable()
export class PostsFactory {
  constructor(private blogsRepository: BlogsRepository) {}

  async create(dto: CreatePostFactoryDto): Promise<PostDocument> {
    const blog: BlogDocument = await this.blogsRepository.findOrNotFoundFail(
      dto.blogId,
    );

    return Post.createInstance({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
      blogName: blog.name,
    });
  }
}
