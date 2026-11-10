import { v4 as uuidv4 } from 'uuid';
import { CreateCommentDomainDto } from './dto/create-comment.domain.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';

export class Comment {
  id: string;
  content: string;
  commentatorUserId: string;
  commentatorUserLogin: string;
  postId: string;
  createdAt: Date;
  updatedAt: Date;

  isNew: boolean;

  static createInstance(dto: CreateCommentDomainDto): Comment {
    const comment = new Comment();
    comment.id = uuidv4();
    comment.content = dto.content;
    comment.commentatorUserId = dto.commentatorInfo.userId;
    comment.commentatorUserLogin = dto.commentatorInfo.userLogin;
    comment.postId = dto.postId;
    comment.createdAt = new Date();
    comment.updatedAt = new Date();
    comment.isNew = true;

    return comment;
  }

  update(dto: UpdateCommentDto) {
    this.content = dto.content;
  }

  isOwnedBy(userId: string): boolean {
    return this.commentatorUserId === userId;
  }
}

export type CommentDocument = Comment;
