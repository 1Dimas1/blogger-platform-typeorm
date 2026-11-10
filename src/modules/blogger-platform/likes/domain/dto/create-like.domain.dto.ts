import { LikeStatus } from '../like.entity';

export class CreatePostLikeDomainDto {
  userId: string;
  postId: string;
  status: LikeStatus;
}

export class CreateCommentLikeDomainDto {
  userId: string;
  commentId: string;
  status: LikeStatus;
}
