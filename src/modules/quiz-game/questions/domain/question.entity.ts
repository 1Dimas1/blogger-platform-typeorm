import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CreateQuestionDomainDto } from './dto/create-question.domain.dto';
import { UpdateQuestionDto } from '../dto/update-question.dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export const questionBodyConstraints = {
  minLength: 10,
  maxLength: 500,
};

const normalizeAnswer = (answer: string): string => answer.trim().toLowerCase();

// soft delete keeps questions that are already part of played games
@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: questionBodyConstraints.maxLength })
  body: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  correctAnswers: string[];

  @Column({ type: 'boolean', default: false })
  published: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // null until the first update/publish (swagger: nullable)
  @Column({ type: 'timestamptz', nullable: true })
  updatedAt: Date | null;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;

  static createInstance(dto: CreateQuestionDomainDto): Question {
    const question = new Question();
    question.body = dto.body;
    question.correctAnswers = dto.correctAnswers;
    question.published = false;
    question.updatedAt = null;
    question.deletedAt = null;

    return question;
  }

  update(dto: UpdateQuestionDto) {
    if (this.published && dto.correctAnswers.length === 0) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'published question must have correct answers',
        extensions: [
          {
            message: 'published question must have correct answers',
            field: 'correctAnswers',
          },
        ],
      });
    }
    this.body = dto.body;
    this.correctAnswers = dto.correctAnswers;
    this.updatedAt = new Date();
  }

  setPublished(published: boolean) {
    if (published && this.correctAnswers.length === 0) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'question without correct answers cannot be published',
        extensions: [
          {
            message: 'question without correct answers cannot be published',
            field: 'published',
          },
        ],
      });
    }
    this.published = published;
    this.updatedAt = new Date();
  }

  // case and surrounding spaces are ignored
  isCorrectAnswer(answer: string): boolean {
    const normalized = normalizeAnswer(answer);
    return this.correctAnswers.some((a) => normalizeAnswer(a) === normalized);
  }
}

export type QuestionDocument = Question;
