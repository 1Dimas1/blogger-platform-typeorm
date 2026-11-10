import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { Question } from './questions/domain/question.entity';
import { Game } from './game/domain/game.entity';
import { GamePlayer } from './game/domain/game-player.entity';
import { GameQuestion } from './game/domain/game-question.entity';
import { Answer } from './game/domain/answer.entity';
import { SaQuestionsController } from './questions/api/sa-questions.controller';
import { PairGameQuizController } from './game/api/pair-game-quiz.controller';
import { QuestionsRepository } from './questions/infrastructure/questions.repository';
import { QuestionsQueryRepository } from './questions/infrastructure/questions.query-repository';
import { GamesRepository } from './game/infrastructure/games.repository';
import { GamesQueryRepository } from './game/infrastructure/games.query-repository';
import { GameTimeoutsService } from './game/application/services/game-timeouts.service';
import { CreateQuestionUseCase } from './questions/application/usecases/create-question.usecase';
import { UpdateQuestionUseCase } from './questions/application/usecases/update-question.usecase';
import { PublishQuestionUseCase } from './questions/application/usecases/publish-question.usecase';
import { DeleteQuestionUseCase } from './questions/application/usecases/delete-question.usecase';
import { GetQuestionsQueryHandler } from './questions/application/queries/get-questions.query';
import { GetQuestionByIdQueryHandler } from './questions/application/queries/get-question-by-id.query';
import { ConnectToGameUseCase } from './game/application/usecases/connect-to-game.usecase';
import { AnswerQuestionUseCase } from './game/application/usecases/answer-question.usecase';
import {
  GetGameByIdQueryHandler,
  GetMyCurrentGameQueryHandler,
  GetMyGamesQueryHandler,
  GetMyStatisticQueryHandler,
  GetTopPlayersQueryHandler,
} from './game/application/queries/game.queries';

const commandHandlers = [
  CreateQuestionUseCase,
  UpdateQuestionUseCase,
  PublishQuestionUseCase,
  DeleteQuestionUseCase,
  ConnectToGameUseCase,
  AnswerQuestionUseCase,
];

const queryHandlers = [
  GetQuestionsQueryHandler,
  GetQuestionByIdQueryHandler,
  GetMyCurrentGameQueryHandler,
  GetGameByIdQueryHandler,
  GetMyGamesQueryHandler,
  GetMyStatisticQueryHandler,
  GetTopPlayersQueryHandler,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Question,
      Game,
      GamePlayer,
      GameQuestion,
      Answer,
    ]),
    UserAccountsModule,
  ],
  controllers: [SaQuestionsController, PairGameQuizController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    QuestionsRepository,
    QuestionsQueryRepository,
    GamesRepository,
    GamesQueryRepository,
    GameTimeoutsService,
  ],
})
export class QuizGameModule {}
