import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { PostViewDto } from '../../src/modules/blogger-platform/posts/api/view-dto/post.view-dto';
import { PaginatedViewDto } from '../../src/core/dto/base.paginated.view-dto';
import { CommentViewDto } from '../../src/modules/blogger-platform/comments/api/view-dto/comment.view-dto';
import { CreateCommentInputDto } from '../../src/modules/blogger-platform/comments/api/input-dto/create-comment.input-dto';
import { LikeInputDto } from '../../src/modules/blogger-platform/likes/api/input-dto/like.input-dto';
import { Constants } from '../../src/core/constants';

interface RequestOptions {
  statusCode?: number;
  auth?: 'admin' | 'none' | { token: string };
}

/**
 * Repository for Posts endpoints.
 * Handles HTTP requests for post management operations.
 */
export class PostsRepository {
  constructor(private readonly httpServer: any) {}

  /**
   * Get all posts with pagination, sorting, and filtering
   * GET /posts
   *
   * @param query - Query parameters (pageNumber, pageSize, sortDirection, sortBy)
   * @param options - Request options (expected status code, auth for like status)
   * @returns Paginated list of posts
   */
  async getAll(
    query: {
      pageNumber?: number;
      pageSize?: number;
      sortDirection?: 'asc' | 'desc';
      sortBy?: string;
    } = {},
    options: RequestOptions = {},
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const expectedStatus = options.statusCode ?? HttpStatus.OK;
    const auth = options.auth;

    let req = request(this.httpServer)
      .get(`/${Constants.GLOBAL_PREFIX}${Constants.PATH.POSTS}`)
      .query(query);

    if (auth && typeof auth === 'object') {
      req = req.set('Authorization', `Bearer ${auth.token}`);
    }

    const response = await req.expect(expectedStatus);

    return response.body;
  }

  /**
   * Get post by ID
   * GET /posts/:id
   *
   * @param id - Post ID
   * @param options - Request options (expected status code, auth for like status)
   * @returns Post view DTO
   */
  async getById(
    id: string,
    options: RequestOptions = {},
  ): Promise<PostViewDto> {
    const expectedStatus = options.statusCode ?? HttpStatus.OK;
    const auth = options.auth;

    let req = request(this.httpServer).get(
      `/${Constants.GLOBAL_PREFIX}${Constants.PATH.POSTS}/${id}`,
    );

    if (auth && typeof auth === 'object') {
      req = req.set('Authorization', `Bearer ${auth.token}`);
    }

    const response = await req.expect(expectedStatus);

    return response.body;
  }

  /**
   * Get all comments for a specific post
   * GET /posts/:postId/comments
   *
   * @param postId - Post ID
   * @param query - Query parameters (pageNumber, pageSize, sortDirection, sortBy)
   * @param options - Request options (expected status code, auth for like status)
   * @returns Paginated list of comments
   */
  async getComments(
    postId: string,
    query: {
      pageNumber?: number;
      pageSize?: number;
      sortDirection?: 'asc' | 'desc';
      sortBy?: string;
    } = {},
    options: RequestOptions = {},
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const expectedStatus = options.statusCode ?? HttpStatus.OK;
    const auth = options.auth;

    let req = request(this.httpServer)
      .get(
        `/${Constants.GLOBAL_PREFIX}${Constants.PATH.POSTS}/${postId}/comments`,
      )
      .query(query);

    if (auth && typeof auth === 'object') {
      req = req.set('Authorization', `Bearer ${auth.token}`);
    }

    const response = await req.expect(expectedStatus);

    return response.body;
  }

  /**
   * Create comment for post (authenticated user)
   * POST /posts/:postId/comments
   *
   * @param postId - Post ID
   * @param data - Comment creation data
   * @param options - Request options (expected status code, auth)
   * @returns Created comment view DTO
   */
  async createComment(
    postId: string,
    data: CreateCommentInputDto,
    options: RequestOptions = {},
  ): Promise<CommentViewDto> {
    const expectedStatus = options.statusCode ?? HttpStatus.CREATED;
    const auth = options.auth;

    let req = request(this.httpServer)
      .post(
        `/${Constants.GLOBAL_PREFIX}${Constants.PATH.POSTS}/${postId}/comments`,
      )
      .send(data);

    if (auth && typeof auth === 'object') {
      req = req.set('Authorization', `Bearer ${auth.token}`);
    } else if (auth === 'none') {
      // No auth
    } else {
      throw new Error('createComment requires user authentication');
    }

    const response = await req.expect(expectedStatus);

    return response.body;
  }

  /**
   * Update like status for post (authenticated user)
   * PUT /posts/:postId/like-status
   *
   * @param postId - Post ID
   * @param likeStatus - Like status (Like, Dislike, None)
   * @param options - Request options (expected status code, auth)
   */
  async updateLikeStatus(
    postId: string,
    likeStatus: LikeInputDto,
    options: RequestOptions = {},
  ): Promise<void> {
    const expectedStatus = options.statusCode ?? HttpStatus.NO_CONTENT;
    const auth = options.auth;

    let req = request(this.httpServer)
      .put(
        `/${Constants.GLOBAL_PREFIX}${Constants.PATH.POSTS}/${postId}/like-status`,
      )
      .send(likeStatus);

    if (auth && typeof auth === 'object') {
      req = req.set('Authorization', `Bearer ${auth.token}`);
    } else if (auth === 'none') {
      // No auth
    } else {
      throw new Error('updateLikeStatus requires user authentication');
    }

    await req.expect(expectedStatus);
  }
}
