import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Constants } from '../../../../core/constants';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { ObjectIdValidationPipe } from '../../../../core/pipes/object-id-validation-transformation-pipe.service';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { AnswerViewDto, GamePairViewDto } from './view-dto/game-pair.view-dto';
import {
  MyStatisticViewDto,
  TopGamePlayerViewDto,
} from './view-dto/statistic.view-dto';
import { AnswerInputDto } from './input-dto/answer.input-dto';
import { GetMyGamesQueryParams } from './input-dto/get-my-games-query-params.input-dto';
import { GetTopPlayersQueryParams } from './input-dto/get-top-players-query-params.input-dto';
import { ConnectToGameCommand } from '../application/usecases/connect-to-game.usecase';
import { AnswerQuestionCommand } from '../application/usecases/answer-question.usecase';
import {
  GetGameByIdQuery,
  GetMyCurrentGameQuery,
  GetMyGamesQuery,
  GetMyStatisticQuery,
  GetTopPlayersQuery,
} from '../application/queries/game.queries';

@ApiTags('PairQuizGame')
@Controller(Constants.PATH.PAIR_GAME_QUIZ)
export class PairGameQuizController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Get('users/top')
  @ApiOperation({ summary: 'Get users top' })
  async getTopPlayers(
    @Query() query: GetTopPlayersQueryParams,
  ): Promise<PaginatedViewDto<TopGamePlayerViewDto[]>> {
    return this.queryBus.execute(new GetTopPlayersQuery(query));
  }

  @Get('users/my-statistic')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user statistic' })
  async getMyStatistic(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<MyStatisticViewDto> {
    return this.queryBus.execute(new GetMyStatisticQuery(user.id));
  }

  @Get('pairs/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Returns all my games (closed games and current)' })
  async getMyGames(
    @ExtractUserFromRequest() user: UserContextDto,
    @Query() query: GetMyGamesQueryParams,
  ): Promise<PaginatedViewDto<GamePairViewDto[]>> {
    return this.queryBus.execute(new GetMyGamesQuery(user.id, query));
  }

  @Get('pairs/my-current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Returns current unfinished user game' })
  @ApiResponse({
    status: 404,
    description: 'If no active pair for current user',
  })
  async getMyCurrentGame(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<GamePairViewDto> {
    return this.queryBus.execute(new GetMyCurrentGameQuery(user.id));
  }

  @Get('pairs/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Returns game by id' })
  @ApiResponse({ status: 400, description: 'If id has invalid format' })
  @ApiResponse({
    status: 403,
    description: 'If current user is not a participant',
  })
  @ApiResponse({ status: 404, description: 'If game not found' })
  async getGameById(
    @Param('id', ObjectIdValidationPipe) id: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<GamePairViewDto> {
    return this.queryBus.execute(new GetGameByIdQuery(id, user.id));
  }

  @Post('pairs/connection')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Connect current user to existing random pending pair or create new pair which will be waiting second player',
  })
  @ApiResponse({
    status: 403,
    description: 'If current user is already participating in active pair',
  })
  async connect(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<GamePairViewDto> {
    const gameId: string = await this.commandBus.execute(
      new ConnectToGameCommand(user.id),
    );

    return this.queryBus.execute(new GetGameByIdQuery(gameId, user.id));
  }

  @Post('pairs/my-current/answers')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Send answer for next not answered question in active pair',
  })
  @ApiResponse({
    status: 403,
    description:
      'If current user is not inside active pair or has already answered all questions',
  })
  async answer(
    @ExtractUserFromRequest() user: UserContextDto,
    @Body() body: AnswerInputDto,
  ): Promise<AnswerViewDto> {
    return this.commandBus.execute(
      new AnswerQuestionCommand(user.id, body.answer),
    );
  }
}
