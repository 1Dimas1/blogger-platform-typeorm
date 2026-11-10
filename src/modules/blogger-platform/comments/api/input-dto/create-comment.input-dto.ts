import { CreateCommentDto } from '../../dto/create-comment.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';

export class CreateCommentInputDto implements CreateCommentDto {
  @ApiProperty()
  @IsStringWithTrim(20, 300)
  content: string;
}
