import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Game } from '../domain/game.entity';
import { GamePlayer } from '../domain/game-player.entity';
import { GameStatus } from '../domain/game.constants';
import { GamePairViewDto } from '../api/view-dto/game-pair.view-dto';
import {
  MyStatisticViewDto,
  PlayerStatisticRawRow,
  TopGamePlayerViewDto,
} from '../api/view-dto/statistic.view-dto';
import { GetMyGamesQueryParams } from '../api/input-dto/get-my-games-query-params.input-dto';
import {
  DEFAULT_TOP_SORT,
  GetTopPlayersQueryParams,
} from '../api/input-dto/get-top-players-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

const myGamesSortColumnMap: Record<string, string> = {
  pairCreatedDate: 'g.pairCreatedDate',
  status: 'g.status',
  startGameDate: 'g.startGameDate',
  finishGameDate: 'g.finishGameDate',
};

const topSortFields = [
  'sumScore',
  'avgScores',
  'gamesCount',
  'winsCount',
  'lossesCount',
  'drawsCount',
];

@Injectable()
export class GamesQueryRepository {
  constructor(
    @InjectRepository(Game) private gamesRepo: Repository<Game>,
    @InjectRepository(GamePlayer) private playersRepo: Repository<GamePlayer>,
  ) {}

  async getByIdForUserOrFail(
    gameId: string,
    userId: string,
  ): Promise<GamePairViewDto> {
    const [game] = await this.loadGames([gameId]);

    if (!game) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'game not found',
      });
    }
    if (!game.isParticipant(userId)) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'current user is not a participant of this game',
      });
    }

    return GamePairViewDto.mapToView(game);
  }

  async getMyGames(
    userId: string,
    query: GetMyGamesQueryParams,
  ): Promise<PaginatedViewDto<GamePairViewDto[]>> {
    const sortColumn =
      myGamesSortColumnMap[query.sortBy] ??
      myGamesSortColumnMap.pairCreatedDate;
    const sortDirection =
      query.sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.gamesRepo
      .createQueryBuilder('g')
      .innerJoin('g.players', 'me', 'me.userId = :userId', { userId });

    const [rows, totalCount] = await Promise.all([
      qb
        .clone()
        .select('g.id', 'id')
        .orderBy(sortColumn, sortDirection)
        .addOrderBy('g.pairCreatedDate', 'DESC')
        .offset(query.calculateSkip())
        .limit(query.pageSize)
        .getRawMany<{ id: string }>(),
      qb.getCount(),
    ]);

    const ids = rows.map((r) => r.id);
    const games = await this.loadGames(ids);
    const byId = new Map(games.map((g) => [g.id, g]));

    return PaginatedViewDto.mapToView({
      items: ids.map((id) => GamePairViewDto.mapToView(byId.get(id)!)),
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getStatistic(userId: string): Promise<MyStatisticViewDto> {
    const row = await this.buildStatisticsQuery()
      .where('gp.userId = :userId', { userId })
      .getRawOne<PlayerStatisticRawRow>();

    return MyStatisticViewDto.mapToView(row);
  }

  async getTop(
    query: GetTopPlayersQueryParams,
  ): Promise<PaginatedViewDto<TopGamePlayerViewDto[]>> {
    const qb = this.buildStatisticsQuery();

    for (const [field, direction] of this.parseTopSort(query.sort)) {
      qb.addOrderBy(`"${field}"`, direction);
    }
    qb.addOrderBy('u.login', 'ASC');

    const [rows, countRow] = await Promise.all([
      qb
        .offset(query.calculateSkip())
        .limit(query.pageSize)
        .getRawMany<PlayerStatisticRawRow>(),
      this.playersRepo
        .createQueryBuilder('gp')
        .innerJoin('gp.game', 'g', 'g.status = :finished', {
          finished: GameStatus.Finished,
        })
        .select('COUNT(DISTINCT gp.userId)', 'count')
        .getRawOne<{ count: string }>(),
    ]);

    return PaginatedViewDto.mapToView({
      items: rows.map(TopGamePlayerViewDto.mapToTopView),
      totalCount: Number(countRow?.count ?? 0),
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  /**
   * Per-player aggregation over finished games; every player row is joined with
   * the opponent's row of the same game to count wins / losses / draws.
   */
  private buildStatisticsQuery(): SelectQueryBuilder<GamePlayer> {
    return this.playersRepo
      .createQueryBuilder('gp')
      .withDeleted()
      .innerJoin('gp.game', 'g', 'g.status = :finished', {
        finished: GameStatus.Finished,
      })
      .innerJoin(
        GamePlayer,
        'opp',
        'opp.gameId = gp.gameId AND opp.id <> gp.id',
      )
      .innerJoin('gp.user', 'u')
      .select('gp.userId', 'userId')
      .addSelect('u.login', 'login')
      .addSelect('SUM(gp.score)', 'sumScore')
      .addSelect('ROUND(AVG(gp.score), 2)', 'avgScores')
      .addSelect('COUNT(*)', 'gamesCount')
      .addSelect('COUNT(*) FILTER (WHERE gp.score > opp.score)', 'winsCount')
      .addSelect('COUNT(*) FILTER (WHERE gp.score < opp.score)', 'lossesCount')
      .addSelect('COUNT(*) FILTER (WHERE gp.score = opp.score)', 'drawsCount')
      .groupBy('gp.userId')
      .addGroupBy('u.login');
  }

  // "avgScores desc" -> ['avgScores', 'DESC']; unknown fields are ignored
  private parseTopSort(sort: string[]): [string, 'ASC' | 'DESC'][] {
    const parsed = sort
      .map((s) => s.trim().split(/\s+/))
      .filter(([field]) => topSortFields.includes(field))
      .map(
        ([field, direction]) =>
          [field, direction?.toLowerCase() === 'asc' ? 'ASC' : 'DESC'] as [
            string,
            'ASC' | 'DESC',
          ],
      );
    return parsed.length > 0 ? parsed : this.parseTopSort(DEFAULT_TOP_SORT);
  }

  private async loadGames(ids: string[]): Promise<Game[]> {
    if (ids.length === 0) return [];
    return this.gamesRepo.find({
      where: { id: In(ids) },
      relations: {
        players: { user: true, answers: true },
        questions: { question: true },
      },
      // keep logins / question bodies of soft-deleted users and questions
      withDeleted: true,
    });
  }
}
