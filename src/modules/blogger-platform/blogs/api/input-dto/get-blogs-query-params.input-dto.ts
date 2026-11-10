import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetBlogsQueryParams extends BaseQueryParams {
  @ApiPropertyOptional({
    type: String,
    default: 'createdAt',
    description: 'Field to sort by',
  })
  @IsString()
  @IsOptional()
  sortBy: string = 'createdAt';

  @ApiPropertyOptional({
    type: String,
    default: null,
    description:
      'Search term for blog Name: Name should contains this term in any position',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  searchNameTerm: string | null = null;
}
