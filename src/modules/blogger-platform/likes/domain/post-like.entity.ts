import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Like } from './like.entity';
import { Post } from '../../posts/domain/post.entity';
import { CreatePostLikeDomainDto } from './dto/create-like.domain.dto';

// one reaction per user per post
@Entity('post_likes')
@Index('idx_post_likes_user_post_unique', ['userId', 'postId'], {
  unique: true,
})
export class PostLike extends Like {
  @ManyToOne(() => Post, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Index()
  @Column({ type: 'uuid' })
  postId: string;

  static createInstance(dto: CreatePostLikeDomainDto): PostLike {
    const like = new PostLike();
    like.userId = dto.userId;
    like.postId = dto.postId;
    like.status = dto.status;

    return like;
  }
}

export type PostLikeDocument = PostLike;
