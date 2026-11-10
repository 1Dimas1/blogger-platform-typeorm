import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GamePlayer } from './game-player.entity';
import { GameQuestion } from './game-question.entity';
import { Answer } from './answer.entity';
import { Question } from '../../questions/domain/question.entity';
import {
  AnswerStatus,
  FINISH_GAME_TIMEOUT_MS,
  GameStatus,
} from './game.constants';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

/**
 * Pair quiz game aggregate: players, their answers and the game questions are
 * loaded and saved together with it (cascade).
 *
 * Rules: both players get the same questions in the same order; +1 point per
 * correct answer; the player who finishes first gets +1 bonus point if he has at
 * least one correct answer; once one player is done the other one has
 * FINISH_GAME_TIMEOUT_MS to finish, otherwise his unanswered questions count as
 * incorrect and the game is finished.
 */
@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // varchar, not a pg enum: sorting by status must be alphabetical
  @Index()
  @Column({ type: 'varchar', length: 20 })
  status: GameStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  pairCreatedDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  startGameDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  finishGameDate: Date | null;

  @OneToMany(() => GamePlayer, (player) => player.game, { cascade: true })
  players: GamePlayer[];

  @OneToMany(() => GameQuestion, (question) => question.game, {
    cascade: true,
  })
  questions: GameQuestion[];

  static createPending(firstPlayerUserId: string): Game {
    const game = new Game();
    game.status = GameStatus.PendingSecondPlayer;
    game.startGameDate = null;
    game.finishGameDate = null;
    game.players = [GamePlayer.createInstance(firstPlayerUserId, 1)];
    game.questions = [];

    return game;
  }

  start(secondPlayerUserId: string, questions: Question[], now: Date) {
    if (this.status !== GameStatus.PendingSecondPlayer) {
      throw new Error('Only a pending game can be started');
    }
    this.players.push(GamePlayer.createInstance(secondPlayerUserId, 2));
    this.questions = questions.map((q, i) => GameQuestion.createInstance(q, i));
    this.status = GameStatus.Active;
    this.startGameDate = now;
  }

  isParticipant(userId: string): boolean {
    return this.players.some((p) => p.userId === userId);
  }

  /**
   * Answers the player's next unanswered question.
   * Requires questions with their `question` relation loaded.
   */
  answer(userId: string, rawAnswer: string, now: Date): Answer {
    const player = this.players.find((p) => p.userId === userId);
    const questionsCount = this.orderedQuestions().length;

    if (
      this.status !== GameStatus.Active ||
      !player ||
      player.answers.length >= questionsCount
    ) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'no active game or all questions are already answered',
      });
    }

    const gameQuestion = this.orderedQuestions()[player.answers.length];
    const isCorrect = gameQuestion.question.isCorrectAnswer(rawAnswer);
    const answer = Answer.createInstance(
      gameQuestion.questionId,
      isCorrect ? AnswerStatus.Correct : AnswerStatus.Incorrect,
      now,
    );

    player.answers.push(answer);
    if (isCorrect) {
      player.score += 1;
    }

    if (player.answers.length === questionsCount) {
      player.finishedAt = now;
      if (this.players.every((p) => p.hasFinished())) {
        this.finish(now);
      }
    }

    return answer;
  }

  // the deadline for the slower player, or null if nobody has finished yet
  getFinishDeadline(): Date | null {
    if (this.status !== GameStatus.Active) return null;
    const finished = this.players.filter((p) => p.hasFinished());
    if (finished.length === 0) return null;
    const firstFinishedAt = Math.min(
      ...finished.map((p) => p.finishedAt!.getTime()),
    );
    return new Date(firstFinishedAt + FINISH_GAME_TIMEOUT_MS);
  }

  /** Finishes the game if the slower player ran out of time. */
  finishIfTimedOut(now: Date): boolean {
    const deadline = this.getFinishDeadline();
    if (!deadline || now < deadline) return false;

    this.finish(deadline);
    return true;
  }

  private finish(finishedAt: Date) {
    const firstFinisher = this.players
      .filter((p) => p.hasFinished())
      .sort((a, b) => a.finishedAt!.getTime() - b.finishedAt!.getTime())[0];

    if (firstFinisher && firstFinisher.score > 0) {
      firstFinisher.score += 1;
    }

    this.status = GameStatus.Finished;
    this.finishGameDate = finishedAt;
  }

  private orderedQuestions(): GameQuestion[] {
    return [...this.questions].sort((a, b) => a.position - b.position);
  }
}

export type GameDocument = Game;
