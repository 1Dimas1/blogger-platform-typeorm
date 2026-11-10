import { Injectable } from '@nestjs/common';
import { Blog, BlogDocument } from '../../domain/blog.entity';
import { CreateBlogDto } from '../../dto/create-blog.dto';

@Injectable()
export class BlogsFactory {
  create(dto: CreateBlogDto): BlogDocument {
    return Blog.createInstance({
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    });
  }
}
