import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../domain/question.entity';
import { QuestionViewDto } from '../api/view-dto/question.view-dto';
import {
  GetQuestionsQueryParams,
  PublishedStatus,
} from '../api/input-dto/get-questions-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

const sortColumnMap: Record<string, string> = {
  createdAt: 'q.createdAt',
  updatedAt: 'q.updatedAt',
  body: 'q.body',
  published: 'q.published',
};

@Injectable()
export class QuestionsQueryRepository {
  constructor(
    @InjectRepository(Question) private questionsRepo: Repository<Question>,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<QuestionViewDto> {
    const question = await this.questionsRepo.findOneBy({ id });

    if (!question) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'question not found',
      });
    }

    return QuestionViewDto.mapToView(question);
  }

  async getAll(
    query: GetQuestionsQueryParams,
  ): Promise<PaginatedViewDto<QuestionViewDto[]>> {
    const qb = this.questionsRepo.createQueryBuilder('q');

    if (query.bodySearchTerm) {
      qb.andWhere('q.body ILIKE :term', { term: `%${query.bodySearchTerm}%` });
    }
    if (query.publishedStatus === PublishedStatus.Published) {
      qb.andWhere('q.published = true');
    } else if (query.publishedStatus === PublishedStatus.NotPublished) {
      qb.andWhere('q.published = false');
    }

    const sortColumn = sortColumnMap[query.sortBy] ?? sortColumnMap.createdAt;
    const sortDirection =
      query.sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [questions, totalCount] = await qb
      .orderBy(sortColumn, sortDirection, 'NULLS LAST')
      .addOrderBy('q.createdAt', 'DESC')
      .skip(query.calculateSkip())
      .take(query.pageSize)
      .getManyAndCount();

    return PaginatedViewDto.mapToView({
      items: questions.map(QuestionViewDto.mapToView),
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
