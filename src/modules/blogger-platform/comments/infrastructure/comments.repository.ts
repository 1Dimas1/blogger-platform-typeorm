import { Injectable } from '@nestjs/common';
import { Comment, CommentDocument } from '../domain/comment.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DbService } from '../../../../db/db.service';

@Injectable()
export class CommentsRepository {
  constructor(private dbService: DbService) {}

  private mapRowToEntity(row: any): Comment {
    const comment = new Comment();
    comment.id = row.id;
    comment.content = row.content;
    comment.commentatorUserId = row.commentator_user_id;
    comment.commentatorUserLogin = row.commentator_user_login;
    comment.postId = row.post_id;
    comment.createdAt = new Date(row.created_at);
    comment.updatedAt = new Date(row.updated_at);
    comment.isNew = false;
    return comment;
  }

  async findById(id: string): Promise<CommentDocument | null> {
    const result = await this.dbService.query(
      `SELECT * FROM comments WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) return null;
    return this.mapRowToEntity(result.rows[0]);
  }

  async save(comment: Comment): Promise<void> {
    if (comment.isNew) {
      await this.dbService.query(
        `INSERT INTO comments (id, content, commentator_user_id, commentator_user_login, post_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          comment.id,
          comment.content,
          comment.commentatorUserId,
          comment.commentatorUserLogin,
          comment.postId,
          comment.createdAt,
          comment.updatedAt,
        ],
      );
      comment.isNew = false;
    } else {
      await this.dbService.query(
        `UPDATE comments SET content = $2 WHERE id = $1`,
        [comment.id, comment.content],
      );
    }
  }

  async delete(comment: Comment): Promise<void> {
    await this.dbService.query(`DELETE FROM comments WHERE id = $1`, [
      comment.id,
    ]);
  }

  async findOrNotFoundFail(id: string): Promise<CommentDocument> {
    const comment = await this.findById(id);
    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'comment not found',
      });
    }
    return comment;
  }
}
