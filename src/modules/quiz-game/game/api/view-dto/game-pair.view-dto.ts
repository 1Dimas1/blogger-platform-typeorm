import { ApiProperty } from '@nestjs/swagger';
import { Game } from '../../domain/game.entity';
import { GamePlayer } from '../../domain/game-player.entity';
import { Answer } from '../../domain/answer.entity';
import { AnswerStatus, GameStatus } from '../../domain/game.constants';

export class AnswerViewDto {
  @ApiProperty()
  questionId: string;

  @ApiProperty({ enum: AnswerStatus })
  answerStatus: AnswerStatus;

  @ApiProperty()
  addedAt: string;

  static mapToView(answer: Answer): AnswerViewDto {
    return {
      questionId: answer.questionId,
      answerStatus: answer.status,
      addedAt: answer.addedAt.toISOString(),
    };
  }
}

export class PlayerViewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  login: string;
}

export class GamePlayerProgressViewDto {
  @ApiProperty({ type: [AnswerViewDto] })
  answers: AnswerViewDto[];

  @ApiProperty({ type: PlayerViewDto })
  player: PlayerViewDto;

  @ApiProperty()
  score: number;

  static mapToView(player: GamePlayer): GamePlayerProgressViewDto {
    return {
      answers: [...player.answers]
        .sort((a, b) => a.addedAt.getTime() - b.addedAt.getTime())
        .map(AnswerViewDto.mapToView),
      player: { id: player.userId, login: player.user.login },
      score: player.score,
    };
  }
}

export class GameQuestionViewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  body: string;
}

export class GamePairViewDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: GamePlayerProgressViewDto })
  firstPlayerProgress: GamePlayerProgressViewDto;

  @ApiProperty({ type: GamePlayerProgressViewDto, nullable: true })
  secondPlayerProgress: GamePlayerProgressViewDto | null;

  @ApiProperty({
    type: [GameQuestionViewDto],
    nullable: true,
    description: 'null while the second player has not connected yet',
  })
  questions: GameQuestionViewDto[] | null;

  @ApiProperty({ enum: GameStatus })
  status: GameStatus;

  @ApiProperty()
  pairCreatedDate: string;

  @ApiProperty({ nullable: true, type: String })
  startGameDate: string | null;

  @ApiProperty({ nullable: true, type: String })
  finishGameDate: string | null;

  /** Expects players.user, players.answers and questions.question loaded. */
  static mapToView(game: Game): GamePairViewDto {
    const first = game.players.find((p) => p.position === 1)!;
    const second = game.players.find((p) => p.position === 2);

    return {
      id: game.id,
      firstPlayerProgress: GamePlayerProgressViewDto.mapToView(first),
      secondPlayerProgress: second
        ? GamePlayerProgressViewDto.mapToView(second)
        : null,
      questions:
        game.status === GameStatus.PendingSecondPlayer
          ? null
          : [...game.questions]
              .sort((a, b) => a.position - b.position)
              .map((q) => ({ id: q.questionId, body: q.question.body })),
      status: game.status,
      pairCreatedDate: game.pairCreatedDate.toISOString(),
      startGameDate: game.startGameDate?.toISOString() ?? null,
      finishGameDate: game.finishGameDate?.toISOString() ?? null,
    };
  }
}
