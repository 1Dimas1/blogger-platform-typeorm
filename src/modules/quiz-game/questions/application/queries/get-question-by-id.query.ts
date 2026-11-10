import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuestionsQueryRepository } from '../../infrastructure/questions.query-repository';
import { QuestionViewDto } from '../../api/view-dto/question.view-dto';

export class GetQuestionByIdQuery {
  constructor(public id: string) {}
}

@QueryHandler(GetQuestionByIdQuery)
export class GetQuestionByIdQueryHandler
  implements IQueryHandler<GetQuestionByIdQuery, QuestionViewDto>
{
  constructor(private questionsQueryRepository: QuestionsQueryRepository) {}

  async execute(query: GetQuestionByIdQuery): Promise<QuestionViewDto> {
    return this.questionsQueryRepository.getByIdOrNotFoundFail(query.id);
  }
}
