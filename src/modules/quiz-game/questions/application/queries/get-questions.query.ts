import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuestionsQueryRepository } from '../../infrastructure/questions.query-repository';
import { GetQuestionsQueryParams } from '../../api/input-dto/get-questions-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { QuestionViewDto } from '../../api/view-dto/question.view-dto';

export class GetQuestionsQuery {
  constructor(public queryParams: GetQuestionsQueryParams) {}
}

@QueryHandler(GetQuestionsQuery)
export class GetQuestionsQueryHandler
  implements
    IQueryHandler<GetQuestionsQuery, PaginatedViewDto<QuestionViewDto[]>>
{
  constructor(private questionsQueryRepository: QuestionsQueryRepository) {}

  async execute(
    query: GetQuestionsQuery,
  ): Promise<PaginatedViewDto<QuestionViewDto[]>> {
    return this.questionsQueryRepository.getAll(query.queryParams);
  }
}
