import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';

export enum PublishedStatus {
  All = 'all',
  Published = 'published',
  NotPublished = 'notPublished',
}

export class GetQuestionsQueryParams extends BaseQueryParams {
  @ApiPropertyOptional({ type: String, default: null })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  bodySearchTerm: string | null = null;

  @ApiPropertyOptional({ enum: PublishedStatus, default: PublishedStatus.All })
  @IsEnum(PublishedStatus)
  @IsOptional()
  publishedStatus: PublishedStatus = PublishedStatus.All;

  @ApiPropertyOptional({ type: String, default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy: string = 'createdAt';
}
