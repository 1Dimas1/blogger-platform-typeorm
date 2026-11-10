import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AnswerInputDto {
  @ApiProperty()
  @IsString()
  answer: string;
}
