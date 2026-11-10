import { Injectable } from '@nestjs/common';
import { Post, PostDocument } from '../domain/post.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DbService } from '../../../../db/db.service';

@Injectable()
export class PostsRepository {
  constructor(private dbService: DbService) {}

  private mapRowToEntity(row: any): Post {
    const post = new Post();
    post.id = row.id;
    post.title = row.title;
    post.shortDescription = row.short_description;
    post.content = row.content;
    post.blogId = row.blog_id;
    post.blogName = row.blog_name;
    post.likesCount = row.likes_count;
    post.dislikesCount = row.dislikes_count;
    post.createdAt = new Date(row.created_at);
    post.updatedAt = new Date(row.updated_at);
    post.deletedAt = row.deleted_at ? new Date(row.deleted_at) : null;
    post.isNew = false;
    return post;
  }

  async findById(id: string): Promise<PostDocument | null> {
    const result = await this.dbService.query(
      `SELECT * FROM posts WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    if (result.rows.length === 0) return null;
    return this.mapRowToEntity(result.rows[0]);
  }

  async save(post: Post): Promise<void> {
    if (post.isNew) {
      await this.dbService.query(
        `INSERT INTO posts (id, title, short_description, content, blog_id, blog_name, likes_count, dislikes_count, created_at, updated_at, deleted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          post.id,
          post.title,
          post.shortDescription,
          post.content,
          post.blogId,
          post.blogName,
          post.likesCount,
          post.dislikesCount,
          post.createdAt,
          post.updatedAt,
          post.deletedAt,
        ],
      );
      post.isNew = false;
    } else {
      await this.dbService.query(
        `UPDATE posts SET
          title = $2, short_description = $3, content = $4, blog_id = $5, blog_name = $6,
          likes_count = $7, dislikes_count = $8, deleted_at = $9
         WHERE id = $1`,
        [
          post.id,
          post.title,
          post.shortDescription,
          post.content,
          post.blogId,
          post.blogName,
          post.likesCount,
          post.dislikesCount,
          post.deletedAt,
        ],
      );
    }
  }

  async findOrNotFoundFail(id: string): Promise<PostDocument> {
    const post = await this.findById(id);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'post not found',
      });
    }
    return post;
  }
}
