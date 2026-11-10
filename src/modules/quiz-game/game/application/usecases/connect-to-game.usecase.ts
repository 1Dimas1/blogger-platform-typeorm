import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamesRepository } from '../../infrastructure/games.repository';
import { GameTimeoutsService } from '../services/game-timeouts.service';
import { Game } from '../../domain/game.entity';
import { GAME_QUESTIONS_COUNT } from '../../domain/game.constants';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class ConnectToGameCommand {
  constructor(public userId: string) {}
}

/**
 * Joins the oldest pending pair (the game starts with random published questions)
 * or creates a new pending pair. Returns the game id.
 */
@CommandHandler(ConnectToGameCommand)
export class ConnectToGameUseCase
  implements ICommandHandler<ConnectToGameCommand, string>
{
  constructor(
    private gamesRepository: GamesRepository,
    private gameTimeoutsService: GameTimeoutsService,
  ) {}

  async execute({ userId }: ConnectToGameCommand): Promise<string> {
    await this.gameTimeoutsService.finishTimedOutGames();

    return this.gamesRepository.runInTransaction(async (manager) => {
      await this.gamesRepository.lockMatchmaking(manager);

      if (
        await this.gamesRepository.findUnfinishedGameIdOfUser(userId, manager)
      ) {
        throw new DomainException({
          code: DomainExceptionCode.Forbidden,
          message: 'current user is already participating in active pair',
        });
      }

      const pendingGameId =
        await this.gamesRepository.findOldestPendingGameId(manager);

      if (pendingGameId) {
        const game = (await this.gamesRepository.lockAndLoad(
          pendingGameId,
          manager,
        ))!;
        const questions =
          await this.gamesRepository.findRandomPublishedQuestions(
            GAME_QUESTIONS_COUNT,
            manager,
          );
        game.start(userId, questions, new Date());
        await this.gamesRepository.save(game, manager);
        return game.id;
      }

      const game = Game.createPending(userId);
      await this.gamesRepository.save(game, manager);
      return game.id;
    });
  }
}
