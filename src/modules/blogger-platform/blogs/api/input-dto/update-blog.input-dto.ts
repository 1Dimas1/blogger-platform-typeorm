import { ApiProperty } from '@nestjs/swagger';
import { UpdateBlogDto } from '../../dto/update-blog.dto';
import { IsString, Length } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import { IsHttpsUrl } from '../../../../../core/decorators/validation/is-https-url.decorator';

export class UpdateBlogInputDto implements UpdateBlogDto {
  @ApiProperty()
  // TODO create name constraints
  @IsStringWithTrim(1, 15)
  name: string;

  @ApiProperty()
  // TODO create description constraints
  @IsStringWithTrim(1, 500)
  description: string;

  @ApiProperty()
  @IsString()
  @IsHttpsUrl()
  // TODO create websiteUrl constraints
  @Length(1, 100)
  websiteUrl: string;
}
