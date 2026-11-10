import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';

export class GetMyGamesQueryParams extends BaseQueryParams {
  @ApiPropertyOptional({ type: String, default: 'pairCreatedDate' })
  @IsString()
  @IsOptional()
  sortBy: string = 'pairCreatedDate';
}
