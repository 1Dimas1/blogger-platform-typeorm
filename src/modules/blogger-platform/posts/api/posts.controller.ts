import {
  Body,
  Controller,
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
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PostViewDto } from './view-dto/post.view-dto';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { Constants } from '../../../../core/constants';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetPostByIdQuery } from '../application/queries/get-post-by-id.query';
import { GetPostsQuery } from '../application/queries/get-posts.query';
import { LikeInputDto } from '../../likes/api/input-dto/like.input-dto';
import { UpdatePostLikeStatusCommand } from '../../likes/application/usecases/update-post-like-status.usecase';
import { CreateCommentCommand } from '../../comments/application/usecases/create-comment.usecase';
import { GetCommentByIdQuery } from '../../comments/application/queries/get-comment-by-id.query';
import { GetCommentsByPostIdQuery } from '../../comments/application/queries/get-comments-by-post-id.query';
import { GetCommentsQueryParams } from '../../comments/api/input-dto/get-comments-query-params.input-dto';
import { CommentViewDto } from '../../comments/api/view-dto/comment.view-dto';
import { CreateCommentInputDto } from '../../comments/api/input-dto/create-comment.input-dto';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';

@ApiTags('Posts')
@Controller(Constants.PATH.POSTS)
export class PostsController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Get()
  @UseGuards(JwtOptionalAuthGuard)
  @ApiOperation({ summary: 'Returns all posts' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getPosts(
    @Query() query: GetPostsQueryParams,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.queryBus.execute<
      GetPostsQuery,
      PaginatedViewDto<PostViewDto[]>
    >(new GetPostsQuery(query, user?.id ?? null));
  }

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  @ApiOperation({ summary: 'Return post by id' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async getPostById(
    @Param('id') id: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ): Promise<PostViewDto> {
    return this.queryBus.execute<GetPostByIdQuery, PostViewDto>(
      new GetPostByIdQuery(id, user?.id ?? null),
    );
  }

  @Get(':postId/comments')
  @UseGuards(JwtOptionalAuthGuard)
  @ApiOperation({ summary: 'Returns comments for specified post' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({
    status: 404,
    description: "If post for passed postId doesn't exist",
  })
  async getCommentsByPost(
    @Param('postId') postId: string,
    @Query() query: GetCommentsQueryParams,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    await this.queryBus.execute<GetPostByIdQuery, PostViewDto>(
      new GetPostByIdQuery(postId, user?.id ?? null),
    );

    return this.queryBus.execute<
      GetCommentsByPostIdQuery,
      PaginatedViewDto<CommentViewDto[]>
    >(new GetCommentsByPostIdQuery(postId, query, user?.id ?? null));
  }

  @Post(':postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new comment' })
  @ApiResponse({ status: 201, description: 'Returns the newly created post' })
  @ApiResponse({
    status: 400,
    description: 'If the inputModel has incorrect values',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: "If post with specified postId doesn't exists",
  })
  async createComment(
    @Param('postId') postId: string,
    @Body() body: CreateCommentInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<CommentViewDto> {
    const commentId: string = await this.commandBus.execute<
      CreateCommentCommand,
      string
    >(new CreateCommentCommand(postId, body, user.id));

    return this.queryBus.execute<GetCommentByIdQuery, CommentViewDto>(
      new GetCommentByIdQuery(commentId, user.id),
    );
  }

  @Put(':postId/like-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Make like/unlike/dislike/undislike operation' })
  @ApiResponse({ status: 204, description: '' })
  @ApiResponse({
    status: 400,
    description: 'If the inputModel has incorrect values',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: "If post with specified postId doesn't exists",
  })
  async updatePostLikeStatus(
    @Param('postId') postId: string,
    @Body() body: LikeInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdatePostLikeStatusCommand(postId, body, user.id),
    );
  }
}
