import { ApiProperty } from '@nestjs/swagger';
import { UpdatePostDto } from '../../dto/update-post.dto';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';

export class UpdatePostInputDto implements UpdatePostDto {
  @ApiProperty()
  // TODO create title constraints
  @IsStringWithTrim(1, 30)
  title: string;

  @ApiProperty()
  // TODO create shortDescription constraints
  @IsStringWithTrim(1, 100)
  shortDescription: string;

  @ApiProperty()
  // TODO create content constraints
  @IsStringWithTrim(1, 1000)
  content: string;
}
