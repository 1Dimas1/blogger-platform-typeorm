import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostLike, PostLikeDocument } from '../domain/post-like.entity';
import {
  CommentLike,
  CommentLikeDocument,
} from '../domain/comment-like.entity';

@Injectable()
export class LikesRepository {
  constructor(
    @InjectRepository(PostLike) private postLikesRepo: Repository<PostLike>,
    @InjectRepository(CommentLike)
    private commentLikesRepo: Repository<CommentLike>,
  ) {}

  async findPostLike(
    userId: string,
    postId: string,
  ): Promise<PostLikeDocument | null> {
    return this.postLikesRepo.findOneBy({ userId, postId });
  }

  async findCommentLike(
    userId: string,
    commentId: string,
  ): Promise<CommentLikeDocument | null> {
    return this.commentLikesRepo.findOneBy({ userId, commentId });
  }

  async savePostLike(like: PostLike): Promise<void> {
    await this.postLikesRepo.save(like);
  }

  async saveCommentLike(like: CommentLike): Promise<void> {
    await this.commentLikesRepo.save(like);
  }
}
