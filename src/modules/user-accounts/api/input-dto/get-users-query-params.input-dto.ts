import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UsersSortBy } from './users-sort-by';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class GetUsersQueryParams extends BaseQueryParams {
  @ApiPropertyOptional({
    enum: UsersSortBy,
    default: UsersSortBy.CreatedAt,
    description: 'Default value: createdAt',
  })
  @IsEnum(UsersSortBy)
  sortBy: UsersSortBy = UsersSortBy.CreatedAt;

  @ApiPropertyOptional({
    type: String,
    default: null,
    description:
      'Search term for user Login: Login should contains this term in any position',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  searchLoginTerm: string | null = null;

  @ApiPropertyOptional({
    type: String,
    default: null,
    description:
      'Search term for user Email: Email should contains this term in any position',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  searchEmailTerm: string | null = null;
}
