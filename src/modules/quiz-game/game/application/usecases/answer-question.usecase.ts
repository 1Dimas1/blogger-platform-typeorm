import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamesRepository } from '../../infrastructure/games.repository';
import { GameTimeoutsService } from '../services/game-timeouts.service';
import { AnswerViewDto } from '../../api/view-dto/game-pair.view-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class AnswerQuestionCommand {
  constructor(
    public userId: string,
    public answer: string,
  ) {}
}

@CommandHandler(AnswerQuestionCommand)
export class AnswerQuestionUseCase
  implements ICommandHandler<AnswerQuestionCommand, AnswerViewDto>
{
  constructor(
    private gamesRepository: GamesRepository,
    private gameTimeoutsService: GameTimeoutsService,
  ) {}

  async execute({
    userId,
    answer,
  }: AnswerQuestionCommand): Promise<AnswerViewDto> {
    await this.gameTimeoutsService.finishTimedOutGames();

    const { answerView, finishDeadline } =
      await this.gamesRepository.runInTransaction(async (manager) => {
        const gameId = await this.gamesRepository.findUnfinishedGameIdOfUser(
          userId,
          manager,
        );
        // the row lock serializes both players' answers to the same game
        const game = gameId
          ? await this.gamesRepository.lockAndLoad(gameId, manager)
          : null;
        if (!game) {
          throw new DomainException({
            code: DomainExceptionCode.Forbidden,
            message: 'current user is not inside active pair',
          });
        }

        const created = game.answer(userId, answer, new Date());
        await this.gamesRepository.save(game, manager);

        return {
          answerView: AnswerViewDto.mapToView(created),
          finishDeadline: game.getFinishDeadline(),
        };
      });

    if (finishDeadline) {
      this.gameTimeoutsService.scheduleFinish(finishDeadline);
    }

    return answerView;
  }
}
