import { LikeStatus } from '../like.entity';

export class CreateLikeDomainDto {
  userId: string;
  parentId: string;
  parentType: 'comment' | 'post';
  status: LikeStatus;
}
