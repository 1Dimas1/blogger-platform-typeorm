import { v4 as uuidv4 } from 'uuid';
import { CreateLikeDomainDto } from './dto/create-like.domain.dto';

export enum LikeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

export class Like {
  id: string;
  userId: string;
  parentId: string;
  parentType: 'comment' | 'post';
  status: LikeStatus;
  createdAt: Date;
  updatedAt: Date;

  isNew: boolean;

  static createInstance(dto: CreateLikeDomainDto): Like {
    const like = new Like();
    like.id = uuidv4();
    like.userId = dto.userId;
    like.parentId = dto.parentId;
    like.parentType = dto.parentType;
    like.status = dto.status;
    like.createdAt = new Date();
    like.updatedAt = new Date();
    like.isNew = true;

    return like;
  }

  updateStatus(status: LikeStatus) {
    this.status = status;
  }
}

export type LikeDocument = Like;
