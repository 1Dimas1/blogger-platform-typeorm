import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog, BlogDocument } from '../domain/blog.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class BlogsRepository {
  constructor(@InjectRepository(Blog) private blogsRepo: Repository<Blog>) {}

  async findById(id: string): Promise<BlogDocument | null> {
    return this.blogsRepo.findOneBy({ id });
  }

  async save(blog: Blog): Promise<void> {
    await this.blogsRepo.save(blog);
  }

  async findOrNotFoundFail(id: string): Promise<BlogDocument> {
    const blog = await this.findById(id);
    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'blog not found',
      });
    }
    return blog;
  }
}
