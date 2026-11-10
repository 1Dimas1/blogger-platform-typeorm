import { ApiProperty } from '@nestjs/swagger';
import { LikeStatus } from '../../../likes/domain/like.entity';

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

  static mapToView(row: any, likesInfo: LikesInfoViewDto): CommentViewDto {
    const dto = new CommentViewDto();

    dto.id = row.id;
    dto.content = row.content;
    dto.commentatorInfo = {
      userId: row.commentator_user_id ?? row.commentatorUserId,
      userLogin: row.commentator_user_login ?? row.commentatorUserLogin,
    };
    dto.createdAt = new Date(row.created_at ?? row.createdAt);
    dto.likesInfo = likesInfo;

    return dto;
  }
}
