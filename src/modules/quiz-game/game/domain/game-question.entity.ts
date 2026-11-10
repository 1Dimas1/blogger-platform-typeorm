import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { Question } from '../../questions/domain/question.entity';

// one of the questions of a game, both players answer them in `position` order
@Entity('game_questions')
@Index('idx_game_questions_game_position_unique', ['gameId', 'position'], {
  unique: true,
})
export class GameQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Game, (game) => game.questions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @Column({ type: 'uuid' })
  gameId: string;

  @ManyToOne(() => Question, { nullable: false })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ type: 'uuid' })
  questionId: string;

  @Column({ type: 'smallint' })
  position: number;

  static createInstance(question: Question, position: number): GameQuestion {
    const gameQuestion = new GameQuestion();
    gameQuestion.question = question;
    gameQuestion.questionId = question.id;
    gameQuestion.position = position;

    return gameQuestion;
  }
}
