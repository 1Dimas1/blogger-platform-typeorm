import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';

export const DEFAULT_TOP_SORT = ['avgScores desc', 'sumScore desc'];

export class GetTopPlayersQueryParams extends BaseQueryParams {
  @ApiPropertyOptional({
    type: [String],
    default: DEFAULT_TOP_SORT,
    description: 'e.g. ?sort=avgScores desc&sort=sumScore desc',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  // a single ?sort=... arrives as a string
  @Transform(({ value }) =>
    value === undefined || Array.isArray(value) ? value : [value],
  )
  sort: string[] = DEFAULT_TOP_SORT;
}
