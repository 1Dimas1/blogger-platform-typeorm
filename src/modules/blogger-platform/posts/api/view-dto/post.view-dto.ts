import { ApiProperty } from '@nestjs/swagger';
import { LikeStatus } from '../../../likes/domain/like.entity';

export class LikeDetailsViewDto {
  @ApiProperty()
  addedAt: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  login: string;
}

export class ExtendedLikesInfoViewDto {
  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  dislikesCount: number;

  @ApiProperty({ enum: LikeStatus })
  myStatus: LikeStatus;

  @ApiProperty({ type: [LikeDetailsViewDto] })
  newestLikes: LikeDetailsViewDto[];
}

export class PostViewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  shortDescription: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  blogId: string;

  @ApiProperty()
  blogName: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: ExtendedLikesInfoViewDto })
  extendedLikesInfo: ExtendedLikesInfoViewDto;

  static mapToView(
    row: any,
    myStatus: LikeStatus = LikeStatus.None,
    newestLikes: LikeDetailsViewDto[] = [],
  ): PostViewDto {
    const dto = new PostViewDto();

    dto.id = row.id;
    dto.title = row.title;
    dto.shortDescription = row.short_description ?? row.shortDescription;
    dto.content = row.content;
    dto.blogId = row.blog_id ?? row.blogId;
    dto.blogName = row.blog_name ?? row.blogName;
    dto.createdAt = new Date(row.created_at ?? row.createdAt);

    dto.extendedLikesInfo = {
      likesCount: row.likes_count ?? row.likesCount ?? 0,
      dislikesCount: row.dislikes_count ?? row.dislikesCount ?? 0,
      myStatus,
      newestLikes,
    };

    return dto;
  }
}
