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
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { UserViewDto } from './view-dto/users.view-dto';
import { CreateUserInputDto } from './input-dto/create-user.input-dto';
import { GetUsersQueryParams } from './input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { Constants } from '../../../core/constants';
import {
  ApiBasicAuth,
  ApiParam,
  ApiResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateUserInputDto } from './input-dto/update-user.input-dto';
import { ObjectIdValidationPipe } from '../../../core/pipes/object-id-validation-transformation-pipe.service';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '../application/usecases/admins/create-user.usecase';
import { UpdateUserCommand } from '../application/usecases/update-user.usecase';
import { DeleteUserCommand } from '../application/usecases/admins/delete-user.usecase';
import { GetUserByIdQuery } from '../application/queries/get-user-by-id.query';

@ApiTags('Users')
@Controller(Constants.PATH.SA.USERS)
export class UsersController {
  constructor(
    private usersQueryRepository: UsersQueryRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiBasicAuth('basicAuth')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, type: UserViewDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiOperation({ summary: 'Returns user by id' })
  @Get(':id')
  @UseGuards(BasicAuthGuard)
  async getById(
    @Param('id', ObjectIdValidationPipe) id: string,
  ): Promise<UserViewDto> {
    return this.queryBus.execute(new GetUserByIdQuery(id));
  }

  @ApiBasicAuth('basicAuth')
  @ApiOperation({ summary: 'Returns all users' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: 'PaginatedViewDto<UserViewDto[]>',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  @UseGuards(BasicAuthGuard)
  async getAll(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    return this.usersQueryRepository.getAll(query);
  }

  @ApiBasicAuth('basicAuth')
  @ApiOperation({ summary: 'Add new user to the system' })
  @ApiResponse({ status: 201, type: UserViewDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @Post()
  @UseGuards(BasicAuthGuard)
  async createUser(@Body() body: CreateUserInputDto): Promise<UserViewDto> {
    const userId: string = await this.commandBus.execute<
      CreateUserCommand,
      string
    >(new CreateUserCommand(body));

    return this.usersQueryRepository.getByIdOrNotFoundFail(userId);
  }

  @ApiBasicAuth('basicAuth')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOperation({ summary: 'Update existing user' })
  @ApiResponse({ status: 200, type: UserViewDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Put(':id')
  @UseGuards(BasicAuthGuard)
  async updateUser(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() body: UpdateUserInputDto,
  ): Promise<UserViewDto> {
    await this.commandBus.execute<UpdateUserCommand, void>(
      new UpdateUserCommand(id, body),
    );
    return this.usersQueryRepository.getByIdOrNotFoundFail(id);
  }

  @ApiBasicAuth('basicAuth')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOperation({ summary: 'Delete user specified by id' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Param('id', ObjectIdValidationPipe) id: string,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteUserCommand(id));
  }
}
