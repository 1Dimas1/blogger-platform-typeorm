import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import { questionBodyConstraints } from '../../domain/question.entity';
import { CreateQuestionDto } from '../../dto/create-question.dto';

export class QuestionInputDto implements CreateQuestionDto {
  @ApiProperty({
    minLength: questionBodyConstraints.minLength,
    maxLength: questionBodyConstraints.maxLength,
  })
  @IsStringWithTrim(
    questionBodyConstraints.minLength,
    questionBodyConstraints.maxLength,
  )
  body: string;

  @ApiProperty({
    type: [String],
    description:
      "All variants of possible correct answers, e.g. ['6', 'six', 'шесть']",
  })
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v) => (typeof v === 'string' ? v.trim() : v))
      : value,
  )
  correctAnswers: string[];
}

export class PublishQuestionInputDto {
  @ApiProperty({
    description: 'True if question is completed and can be used in the game',
  })
  @IsBoolean()
  published: boolean;
}
