import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { GamesRepository } from '../../infrastructure/games.repository';

/**
 * Enforces the "10 seconds after the first player finished" rule.
 *
 * finishTimedOutGames() is called at the start of every game command/query, so the
 * state is correct even where no timer survives between requests (serverless).
 * scheduleFinish() additionally finishes the game on time in a long-running process.
 */
@Injectable()
export class GameTimeoutsService implements OnModuleDestroy {
  private readonly logger = new Logger(GameTimeoutsService.name);
  private readonly timers = new Set<NodeJS.Timeout>();

  constructor(private gamesRepository: GamesRepository) {}

  async finishTimedOutGames(): Promise<void> {
    const gameIds = await this.gamesRepository.findTimedOutGameIds(new Date());

    for (const gameId of gameIds) {
      await this.gamesRepository.runInTransaction(async (manager) => {
        const game = await this.gamesRepository.lockAndLoad(gameId, manager);
        if (game && game.finishIfTimedOut(new Date())) {
          await this.gamesRepository.save(game, manager);
        }
      });
    }
  }

  scheduleFinish(deadline: Date): void {
    const delay = Math.max(deadline.getTime() - Date.now(), 0) + 50;
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      this.finishTimedOutGames().catch((error) =>
        this.logger.error('Failed to finish timed out games', error),
      );
    }, delay);
    timer.unref();
    this.timers.add(timer);
  }

  onModuleDestroy() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }
}
