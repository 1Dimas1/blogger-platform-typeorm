import { Injectable } from '@nestjs/common';
import { Blog, BlogDocument } from '../domain/blog.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DbService } from '../../../../db/db.service';

@Injectable()
export class BlogsRepository {
  constructor(private dbService: DbService) {}

  private mapRowToEntity(row: any): Blog {
    const blog = new Blog();
    blog.id = row.id;
    blog.name = row.name;
    blog.description = row.description;
    blog.websiteUrl = row.website_url;
    blog.isMembership = row.is_membership;
    blog.createdAt = new Date(row.created_at);
    blog.updatedAt = new Date(row.updated_at);
    blog.deletedAt = row.deleted_at ? new Date(row.deleted_at) : null;
    blog.isNew = false;
    return blog;
  }

  async findById(id: string): Promise<BlogDocument | null> {
    const result = await this.dbService.query(
      `SELECT * FROM blogs WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    if (result.rows.length === 0) return null;
    return this.mapRowToEntity(result.rows[0]);
  }

  async save(blog: Blog): Promise<void> {
    if (blog.isNew) {
      await this.dbService.query(
        `INSERT INTO blogs (id, name, description, website_url, is_membership, created_at, updated_at, deleted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          blog.id,
          blog.name,
          blog.description,
          blog.websiteUrl,
          blog.isMembership,
          blog.createdAt,
          blog.updatedAt,
          blog.deletedAt,
        ],
      );
      blog.isNew = false;
    } else {
      await this.dbService.query(
        `UPDATE blogs SET
          name = $2, description = $3, website_url = $4, is_membership = $5, deleted_at = $6
         WHERE id = $1`,
        [
          blog.id,
          blog.name,
          blog.description,
          blog.websiteUrl,
          blog.isMembership,
          blog.deletedAt,
        ],
      );
    }
  }

  async findOrNotFoundFail(id: string): Promise<BlogDocument> {
    const blog = await this.findById(id);
    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'blog not found',
      });
    }
    return blog;
  }
}
