import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question, QuestionDocument } from '../domain/question.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class QuestionsRepository {
  constructor(
    @InjectRepository(Question) private questionsRepo: Repository<Question>,
  ) {}

  async findById(id: string): Promise<QuestionDocument | null> {
    // a malformed id can't exist in a uuid column -> not found, not a cast error
    if (!UUID_REGEX.test(id)) return null;
    return this.questionsRepo.findOneBy({ id });
  }

  async findOrNotFoundFail(id: string): Promise<QuestionDocument> {
    const question = await this.findById(id);
    if (!question) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'question not found',
      });
    }
    return question;
  }

  async save(question: Question): Promise<void> {
    await this.questionsRepo.save(question);
  }

  async softDelete(question: Question): Promise<void> {
    await this.questionsRepo.softDelete({ id: question.id });
  }
}
