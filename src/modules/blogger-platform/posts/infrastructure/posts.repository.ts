import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostDocument } from '../domain/post.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class PostsRepository {
  constructor(@InjectRepository(Post) private postsRepo: Repository<Post>) {}

  async findById(id: string): Promise<PostDocument | null> {
    return this.postsRepo.findOneBy({ id });
  }

  async save(post: Post): Promise<void> {
    await this.postsRepo.save(post);
  }

  async findOrNotFoundFail(id: string): Promise<PostDocument> {
    const post = await this.findById(id);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'post not found',
      });
    }
    return post;
  }
}
