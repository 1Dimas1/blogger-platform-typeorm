import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GamesQueryRepository } from '../../infrastructure/games.query-repository';
import { GamesRepository } from '../../infrastructure/games.repository';
import { GameTimeoutsService } from '../services/game-timeouts.service';
import { GamePairViewDto } from '../../api/view-dto/game-pair.view-dto';
import {
  MyStatisticViewDto,
  TopGamePlayerViewDto,
} from '../../api/view-dto/statistic.view-dto';
import { GetMyGamesQueryParams } from '../../api/input-dto/get-my-games-query-params.input-dto';
import { GetTopPlayersQueryParams } from '../../api/input-dto/get-top-players-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

// every handler first finishes games whose 10 seconds have run out, so reads are never stale

export class GetMyCurrentGameQuery {
  constructor(public userId: string) {}
}

@QueryHandler(GetMyCurrentGameQuery)
export class GetMyCurrentGameQueryHandler
  implements IQueryHandler<GetMyCurrentGameQuery, GamePairViewDto>
{
  constructor(
    private gamesRepository: GamesRepository,
    private gamesQueryRepository: GamesQueryRepository,
    private gameTimeoutsService: GameTimeoutsService,
  ) {}

  async execute({ userId }: GetMyCurrentGameQuery): Promise<GamePairViewDto> {
    await this.gameTimeoutsService.finishTimedOutGames();

    const gameId =
      await this.gamesRepository.findUnfinishedGameIdOfUser(userId);
    if (!gameId) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'no active pair for current user',
      });
    }

    return this.gamesQueryRepository.getByIdForUserOrFail(gameId, userId);
  }
}

export class GetGameByIdQuery {
  constructor(
    public gameId: string,
    public userId: string,
  ) {}
}

@QueryHandler(GetGameByIdQuery)
export class GetGameByIdQueryHandler
  implements IQueryHandler<GetGameByIdQuery, GamePairViewDto>
{
  constructor(
    private gamesQueryRepository: GamesQueryRepository,
    private gameTimeoutsService: GameTimeoutsService,
  ) {}

  async execute({
    gameId,
    userId,
  }: GetGameByIdQuery): Promise<GamePairViewDto> {
    await this.gameTimeoutsService.finishTimedOutGames();

    return this.gamesQueryRepository.getByIdForUserOrFail(gameId, userId);
  }
}

export class GetMyGamesQuery {
  constructor(
    public userId: string,
    public queryParams: GetMyGamesQueryParams,
  ) {}
}

@QueryHandler(GetMyGamesQuery)
export class GetMyGamesQueryHandler
  implements IQueryHandler<GetMyGamesQuery, PaginatedViewDto<GamePairViewDto[]>>
{
  constructor(
    private gamesQueryRepository: GamesQueryRepository,
    private gameTimeoutsService: GameTimeoutsService,
  ) {}

  async execute({
    userId,
    queryParams,
  }: GetMyGamesQuery): Promise<PaginatedViewDto<GamePairViewDto[]>> {
    await this.gameTimeoutsService.finishTimedOutGames();

    return this.gamesQueryRepository.getMyGames(userId, queryParams);
  }
}

export class GetMyStatisticQuery {
  constructor(public userId: string) {}
}

@QueryHandler(GetMyStatisticQuery)
export class GetMyStatisticQueryHandler
  implements IQueryHandler<GetMyStatisticQuery, MyStatisticViewDto>
{
  constructor(
    private gamesQueryRepository: GamesQueryRepository,
    private gameTimeoutsService: GameTimeoutsService,
  ) {}

  async execute({ userId }: GetMyStatisticQuery): Promise<MyStatisticViewDto> {
    await this.gameTimeoutsService.finishTimedOutGames();

    return this.gamesQueryRepository.getStatistic(userId);
  }
}

export class GetTopPlayersQuery {
  constructor(public queryParams: GetTopPlayersQueryParams) {}
}

@QueryHandler(GetTopPlayersQuery)
export class GetTopPlayersQueryHandler
  implements
    IQueryHandler<GetTopPlayersQuery, PaginatedViewDto<TopGamePlayerViewDto[]>>
{
  constructor(
    private gamesQueryRepository: GamesQueryRepository,
    private gameTimeoutsService: GameTimeoutsService,
  ) {}

  async execute({
    queryParams,
  }: GetTopPlayersQuery): Promise<PaginatedViewDto<TopGamePlayerViewDto[]>> {
    await this.gameTimeoutsService.finishTimedOutGames();

    return this.gamesQueryRepository.getTop(queryParams);
  }
}
