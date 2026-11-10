import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AnswerStatus } from './game.constants';
import { GamePlayer } from './game-player.entity';
import { Question } from '../../questions/domain/question.entity';

@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GamePlayer, (player) => player.answers, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'player_id' })
  player: GamePlayer;

  @Index()
  @Column({ type: 'uuid' })
  playerId: string;

  @ManyToOne(() => Question, { nullable: false })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ type: 'uuid' })
  questionId: string;

  @Column({ type: 'varchar', length: 10 })
  status: AnswerStatus;

  @Column({ type: 'timestamptz' })
  addedAt: Date;

  static createInstance(
    questionId: string,
    status: AnswerStatus,
    addedAt: Date,
  ): Answer {
    const answer = new Answer();
    answer.questionId = questionId;
    answer.status = status;
    answer.addedAt = addedAt;

    return answer;
  }
}
