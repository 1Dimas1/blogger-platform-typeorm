import { ApiProperty } from '@nestjs/swagger';
import { LikeStatus } from '../../../likes/domain/like.entity';

// one row of PostsQueryRepository's select (posts + blog name + like counters)
export type PostRawRow = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  likesCount: string | number;
  dislikesCount: string | number;
  myStatus: LikeStatus | null;
};

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
    row: PostRawRow,
    newestLikes: LikeDetailsViewDto[] = [],
  ): PostViewDto {
    const dto = new PostViewDto();

    dto.id = row.id;
    dto.title = row.title;
    dto.shortDescription = row.shortDescription;
    dto.content = row.content;
    dto.blogId = row.blogId;
    dto.blogName = row.blogName;
    dto.createdAt = new Date(row.createdAt);

    dto.extendedLikesInfo = {
      likesCount: Number(row.likesCount),
      dislikesCount: Number(row.dislikesCount),
      myStatus: row.myStatus ?? LikeStatus.None,
      newestLikes,
    };

    return dto;
  }
}
