import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Like } from './like.entity';
import { Comment } from '../../comments/domain/comment.entity';
import { CreateCommentLikeDomainDto } from './dto/create-like.domain.dto';

// one reaction per user per comment; removed together with the comment
@Entity('comment_likes')
@Index('idx_comment_likes_user_comment_unique', ['userId', 'commentId'], {
  unique: true,
})
export class CommentLike extends Like {
  @ManyToOne(() => Comment, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @Index()
  @Column({ type: 'uuid' })
  commentId: string;

  static createInstance(dto: CreateCommentLikeDomainDto): CommentLike {
    const like = new CommentLike();
    like.userId = dto.userId;
    like.commentId = dto.commentId;
    like.status = dto.status;

    return like;
  }
}

export type CommentLikeDocument = CommentLike;
