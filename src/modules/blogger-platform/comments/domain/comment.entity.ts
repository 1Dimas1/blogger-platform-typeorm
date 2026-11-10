import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CreateCommentDomainDto } from './dto/create-comment.domain.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { User } from '../../../user-accounts/domain/user.entity';
import { Post } from '../../posts/domain/post.entity';

// commentator login comes from the users join (see CommentsQueryRepository)
@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 300 })
  content: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'commentator_user_id' })
  commentator: User;

  @Column({ type: 'uuid' })
  commentatorUserId: string;

  @ManyToOne(() => Post, (post) => post.comments, { nullable: false })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Index()
  @Column({ type: 'uuid' })
  postId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  static createInstance(dto: CreateCommentDomainDto): Comment {
    const comment = new Comment();
    comment.content = dto.content;
    comment.commentatorUserId = dto.commentatorUserId;
    comment.postId = dto.postId;

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
