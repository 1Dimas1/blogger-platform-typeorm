import { Injectable } from '@nestjs/common';
import { PostLike, PostLikeDocument } from '../../domain/post-like.entity';
import {
  CommentLike,
  CommentLikeDocument,
} from '../../domain/comment-like.entity';
import {
  CreateCommentLikeDomainDto,
  CreatePostLikeDomainDto,
} from '../../domain/dto/create-like.domain.dto';

@Injectable()
export class LikesFactory {
  createPostLike(dto: CreatePostLikeDomainDto): PostLikeDocument {
    return PostLike.createInstance(dto);
  }

  createCommentLike(dto: CreateCommentLikeDomainDto): CommentLikeDocument {
    return CommentLike.createInstance(dto);
  }
}
