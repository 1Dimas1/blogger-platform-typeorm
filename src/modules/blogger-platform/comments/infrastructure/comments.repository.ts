import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment, CommentDocument } from '../domain/comment.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectRepository(Comment) private commentsRepo: Repository<Comment>,
  ) {}

  async findById(id: string): Promise<CommentDocument | null> {
    return this.commentsRepo.findOneBy({ id });
  }

  async save(comment: Comment): Promise<void> {
    await this.commentsRepo.save(comment);
  }

  // comment_likes rows go with it (ON DELETE CASCADE)
  async delete(comment: Comment): Promise<void> {
    await this.commentsRepo.delete({ id: comment.id });
  }

  async findOrNotFoundFail(id: string): Promise<CommentDocument> {
    const comment = await this.findById(id);
    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'comment not found',
      });
    }
    return comment;
  }
}
