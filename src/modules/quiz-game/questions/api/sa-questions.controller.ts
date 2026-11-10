import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Constants } from '../../../../core/constants';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { GetQuestionsQueryParams } from './input-dto/get-questions-query-params.input-dto';
import {
  PublishQuestionInputDto,
  QuestionInputDto,
} from './input-dto/question.input-dto';
import { QuestionViewDto } from './view-dto/question.view-dto';
import { GetQuestionsQuery } from '../application/queries/get-questions.query';
import { GetQuestionByIdQuery } from '../application/queries/get-question-by-id.query';
import { CreateQuestionCommand } from '../application/usecases/create-question.usecase';
import { UpdateQuestionCommand } from '../application/usecases/update-question.usecase';
import { PublishQuestionCommand } from '../application/usecases/publish-question.usecase';
import { DeleteQuestionCommand } from '../application/usecases/delete-question.usecase';

@ApiTags('SA-QuizQuestions')
@Controller(Constants.PATH.SA.QUIZ_QUESTIONS)
@UseGuards(BasicAuthGuard)
@ApiBasicAuth()
export class SaQuestionsController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Returns all questions with pagination and filtering',
  })
  async getQuestions(
    @Query() query: GetQuestionsQueryParams,
  ): Promise<PaginatedViewDto<QuestionViewDto[]>> {
    return this.queryBus.execute(new GetQuestionsQuery(query));
  }

  @Post()
  @ApiOperation({ summary: 'Create question' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({
    status: 400,
    description: 'If the inputModel has incorrect values',
  })
  async createQuestion(
    @Body() body: QuestionInputDto,
  ): Promise<QuestionViewDto> {
    const id: string = await this.commandBus.execute(
      new CreateQuestionCommand(body),
    );

    return this.queryBus.execute(new GetQuestionByIdQuery(id));
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update question' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async updateQuestion(
    @Param('id') id: string,
    @Body() body: QuestionInputDto,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateQuestionCommand(id, body));
  }

  @Put(':id/publish')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Publish/unpublish question' })
  async publishQuestion(
    @Param('id') id: string,
    @Body() body: PublishQuestionInputDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new PublishQuestionCommand(id, body.published),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete question' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async deleteQuestion(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteQuestionCommand(id));
  }
}
