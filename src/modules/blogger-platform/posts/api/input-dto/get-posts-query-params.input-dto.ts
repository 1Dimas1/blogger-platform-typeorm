import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetPostsQueryParams extends BaseQueryParams {
  @ApiPropertyOptional({
    type: String,
    default: 'createdAt',
    description: 'Field to sort by',
  })
  @IsString()
  @IsOptional()
  sortBy: string = 'createdAt';
}
