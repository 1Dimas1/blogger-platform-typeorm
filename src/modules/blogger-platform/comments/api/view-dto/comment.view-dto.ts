import { ApiProperty } from '@nestjs/swagger';
import { LikeStatus } from '../../../likes/domain/like.entity';

// one row of CommentsQueryRepository's select (comment + commentator login + like counters)
export type CommentRawRow = {
  id: string;
  content: string;
  commentatorUserId: string;
  commentatorUserLogin: string;
  createdAt: Date;
  likesCount: string | number;
  dislikesCount: string | number;
  myStatus: LikeStatus | null;
};

export class LikesInfoViewDto {
  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  dislikesCount: number;

  @ApiProperty({ enum: LikeStatus })
  myStatus: LikeStatus;
}

export class CommentatorInfoViewDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  userLogin: string;
}

export class CommentViewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: CommentatorInfoViewDto })
  commentatorInfo: CommentatorInfoViewDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: LikesInfoViewDto })
  likesInfo: LikesInfoViewDto;

  static mapToView(row: CommentRawRow): CommentViewDto {
    const dto = new CommentViewDto();

    dto.id = row.id;
    dto.content = row.content;
    dto.commentatorInfo = {
      userId: row.commentatorUserId,
      userLogin: row.commentatorUserLogin,
    };
    dto.createdAt = new Date(row.createdAt);
    dto.likesInfo = {
      likesCount: Number(row.likesCount),
      dislikesCount: Number(row.dislikesCount),
      myStatus: row.myStatus ?? LikeStatus.None,
    };

    return dto;
  }
}
