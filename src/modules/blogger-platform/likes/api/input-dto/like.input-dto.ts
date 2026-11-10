import { ApiProperty } from '@nestjs/swagger';
import { LikeDto } from '../../dto/like.dto';
import { LikeStatus } from '../../domain/like.entity';
import { IsEnum } from 'class-validator';

export class LikeInputDto implements LikeDto {
  @ApiProperty({ enum: LikeStatus })
  @IsEnum(LikeStatus)
  likeStatus: LikeStatus;
}
