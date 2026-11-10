import { Injectable } from '@nestjs/common';
import { Comment, CommentDocument } from '../../domain/comment.entity';

export interface CreateCommentFactoryDto {
  content: string;
  userId: string;
  userLogin: string;
  postId: string;
}

@Injectable()
export class CommentsFactory {
  async create(dto: CreateCommentFactoryDto): Promise<CommentDocument> {
    return Comment.createInstance({
      content: dto.content,
      commentatorInfo: {
        userId: dto.userId,
        userLogin: dto.userLogin,
      },
      postId: dto.postId,
    });
  }
}
