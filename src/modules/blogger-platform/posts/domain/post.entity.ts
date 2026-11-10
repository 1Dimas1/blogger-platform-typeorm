import { v4 as uuidv4 } from 'uuid';
import { UpdatePostDto } from '../dto/update-post.dto';
import { CreatePostDomainDto } from './dto/create-post.domain.dto';

export class Post {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  likesCount: number;
  dislikesCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  isNew: boolean;

  static createInstance(dto: CreatePostDomainDto): Post {
    const post = new Post();
    post.id = uuidv4();
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.blogName = dto.blogName;
    post.likesCount = 0;
    post.dislikesCount = 0;
    post.createdAt = new Date();
    post.updatedAt = new Date();
    post.deletedAt = null;
    post.isNew = true;

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

  updateLikesInfo(likesCount: number, dislikesCount: number) {
    this.likesCount = likesCount;
    this.dislikesCount = dislikesCount;
  }
}

export type PostDocument = Post;
