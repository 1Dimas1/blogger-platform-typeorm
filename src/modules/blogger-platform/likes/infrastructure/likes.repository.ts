import { Injectable } from '@nestjs/common';
import { Like, LikeDocument, LikeStatus } from '../domain/like.entity';
import { DbService } from '../../../../db/db.service';

@Injectable()
export class LikesRepository {
  constructor(private dbService: DbService) {}

  private mapRowToEntity(row: any): Like {
    const like = new Like();
    like.id = row.id;
    like.userId = row.user_id;
    like.parentId = row.parent_id;
    like.parentType = row.parent_type;
    like.status = row.status as LikeStatus;
    like.createdAt = new Date(row.created_at);
    like.updatedAt = new Date(row.updated_at);
    like.isNew = false;
    return like;
  }

  async findByUserAndParent(
    userId: string,
    parentId: string,
    parentType: 'comment' | 'post',
  ): Promise<LikeDocument | null> {
    const result = await this.dbService.query(
      `SELECT * FROM likes WHERE user_id = $1 AND parent_id = $2 AND parent_type = $3`,
      [userId, parentId, parentType],
    );
    if (result.rows.length === 0) return null;
    return this.mapRowToEntity(result.rows[0]);
  }

  async findByParent(
    parentId: string,
    parentType: 'comment' | 'post',
  ): Promise<LikeDocument[]> {
    const result = await this.dbService.query(
      `SELECT * FROM likes WHERE parent_id = $1 AND parent_type = $2`,
      [parentId, parentType],
    );
    return result.rows.map((row: any) => this.mapRowToEntity(row));
  }

  async findNewestLikes(
    parentId: string,
    parentType: 'comment' | 'post',
    limit: number,
  ): Promise<LikeDocument[]> {
    const result = await this.dbService.query(
      `SELECT * FROM likes
       WHERE parent_id = $1 AND parent_type = $2 AND status = 'Like'
       ORDER BY created_at DESC
       LIMIT $3`,
      [parentId, parentType, limit],
    );
    return result.rows.map((row: any) => this.mapRowToEntity(row));
  }

  async save(like: Like): Promise<void> {
    if (like.isNew) {
      await this.dbService.query(
        `INSERT INTO likes (id, user_id, parent_id, parent_type, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          like.id,
          like.userId,
          like.parentId,
          like.parentType,
          like.status,
          like.createdAt,
          like.updatedAt,
        ],
      );
      like.isNew = false;
    } else {
      await this.dbService.query(`UPDATE likes SET status = $2 WHERE id = $1`, [
        like.id,
        like.status,
      ]);
    }
  }

  async delete(like: Like): Promise<void> {
    await this.dbService.query(`DELETE FROM likes WHERE id = $1`, [like.id]);
  }
}
