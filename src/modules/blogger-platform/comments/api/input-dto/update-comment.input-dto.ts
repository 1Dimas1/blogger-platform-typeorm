import { ApiProperty } from '@nestjs/swagger';
import { UpdateCommentDto } from '../../dto/update-comment.dto';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';

export class UpdateCommentInputDto implements UpdateCommentDto {
  @ApiProperty()
  // TODO create content constraints
  @IsStringWithTrim(20, 300)
  content: string;
}
