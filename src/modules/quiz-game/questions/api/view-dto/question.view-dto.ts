import { ApiProperty } from '@nestjs/swagger';
import { Question } from '../../domain/question.entity';

export class QuestionViewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ type: [String] })
  correctAnswers: string[];

  @ApiProperty()
  published: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ nullable: true, type: String })
  updatedAt: string | null;

  static mapToView(question: Question): QuestionViewDto {
    const dto = new QuestionViewDto();

    dto.id = question.id;
    dto.body = question.body;
    dto.correctAnswers = question.correctAnswers;
    dto.published = question.published;
    dto.createdAt = question.createdAt.toISOString();
    dto.updatedAt = question.updatedAt
      ? question.updatedAt.toISOString()
      : null;

    return dto;
  }
}
