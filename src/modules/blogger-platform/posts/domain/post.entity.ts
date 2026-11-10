import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UpdatePostDto } from '../dto/update-post.dto';
import { CreatePostDomainDto } from './dto/create-post.domain.dto';
import { Blog } from '../../blogs/domain/blog.entity';
import { Comment } from '../../comments/domain/comment.entity';

// blogName comes from the blogs join, like counters from post_likes (see PostsQueryRepository)
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  title: string;

  @Column({ type: 'varchar', length: 100 })
  shortDescription: string;

  @Column({ type: 'varchar', length: 1000 })
  content: string;

  @ManyToOne(() => Blog, (blog) => blog.posts, { nullable: false })
  @JoinColumn({ name: 'blog_id' })
  blog: Blog;

  @Index()
  @Column({ type: 'uuid' })
  blogId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  static createInstance(dto: CreatePostDomainDto): Post {
    const post = new Post();
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.deletedAt = null;

    return post;
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deletedAt = new Date();
  }

  update(dto: UpdatePostDto) {
    this.title = dto.title;
    this.shortDescription = dto.shortDescription;
    this.content = dto.content;
    if (dto.blogId) {
      this.blogId = dto.blogId;
    }
  }
}

export type PostDocument = Post;
