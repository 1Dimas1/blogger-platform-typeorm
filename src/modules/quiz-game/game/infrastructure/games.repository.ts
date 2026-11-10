import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { Game, GameDocument } from '../domain/game.entity';
import { GamePlayer } from '../domain/game-player.entity';
import { FINISH_GAME_TIMEOUT_MS, GameStatus } from '../domain/game.constants';
import { Question } from '../../questions/domain/question.entity';

// arbitrary key of the transaction-level advisory lock that serializes matchmaking
const MATCHMAKING_LOCK_KEY = 2_524_001;

/**
 * Write side of the game aggregate. Methods taking an EntityManager must be
 * called inside a transaction (see runInTransaction) so row locks hold until commit.
 */
@Injectable()
export class GamesRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  runInTransaction<T>(
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(work);
  }

  // two users connecting at the same time must not both create (or both join) a pair
  async lockMatchmaking(manager: EntityManager): Promise<void> {
    await manager.query('SELECT pg_advisory_xact_lock($1)', [
      MATCHMAKING_LOCK_KEY,
    ]);
  }

  async findUnfinishedGameIdOfUser(
    userId: string,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<string | null> {
    const row = await manager
      .getRepository(GamePlayer)
      .createQueryBuilder('gp')
      .innerJoin('gp.game', 'g')
      .select('g.id', 'id')
      .where('gp.userId = :userId', { userId })
      .andWhere('g.status IN (:...statuses)', {
        statuses: [GameStatus.PendingSecondPlayer, GameStatus.Active],
      })
      .getRawOne<{ id: string }>();
    return row?.id ?? null;
  }

  async findOldestPendingGameId(
    manager: EntityManager,
  ): Promise<string | null> {
    const game = await manager
      .getRepository(Game)
      .createQueryBuilder('g')
      .select('g.id')
      .where('g.status = :status', { status: GameStatus.PendingSecondPlayer })
      .orderBy('g.pairCreatedDate', 'ASC')
      .getOne();
    return game?.id ?? null;
  }

  /** Locks the game row (FOR UPDATE) and loads the whole aggregate. */
  async lockAndLoad(
    gameId: string,
    manager: EntityManager,
  ): Promise<GameDocument | null> {
    const locked = await manager
      .getRepository(Game)
      .createQueryBuilder('g')
      .select('g.id')
      .where('g.id = :gameId', { gameId })
      .setLock('pessimistic_write')
      .getOne();
    if (!locked) return null;

    return manager.getRepository(Game).findOne({
      where: { id: gameId },
      relations: {
        players: { answers: true },
        questions: { question: true },
      },
      withDeleted: true,
    });
  }

  async findRandomPublishedQuestions(
    count: number,
    manager: EntityManager,
  ): Promise<Question[]> {
    return manager
      .getRepository(Question)
      .createQueryBuilder('q')
      .where('q.published = true')
      .orderBy('RANDOM()')
      .limit(count)
      .getMany();
  }

  async save(game: Game, manager: EntityManager): Promise<void> {
    await manager.getRepository(Game).save(game);
  }

  // active games where one player finished more than FINISH_GAME_TIMEOUT_MS ago
  async findTimedOutGameIds(now: Date): Promise<string[]> {
    const rows = await this.dataSource
      .getRepository(GamePlayer)
      .createQueryBuilder('gp')
      .innerJoin('gp.game', 'g')
      .select('DISTINCT g.id', 'id')
      .where('g.status = :status', { status: GameStatus.Active })
      .andWhere('gp.finishedAt <= :deadline', {
        deadline: new Date(now.getTime() - FINISH_GAME_TIMEOUT_MS),
      })
      .getRawMany<{ id: string }>();
    return rows.map((r) => r.id);
  }
}
