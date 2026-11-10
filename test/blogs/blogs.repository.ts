import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { BlogViewDto } from '../../src/modules/blogger-platform/blogs/api/view-dto/blogs.view-dto';
import { PaginatedViewDto } from '../../src/core/dto/base.paginated.view-dto';
import { CreateBlogInputDto } from '../../src/modules/blogger-platform/blogs/api/input-dto/create-blog.input-dto';
import { UpdateBlogInputDto } from '../../src/modules/blogger-platform/blogs/api/input-dto/update-blog.input-dto';
import { PostViewDto } from '../../src/modules/blogger-platform/posts/api/view-dto/post.view-dto';
import { CreatePostByBlogIdInputDto } from '../../src/modules/blogger-platform/posts/api/input-dto/create-post.input-dto';
import { UpdatePostInputDto } from '../../src/modules/blogger-platform/posts/api/input-dto/update-post.input-dto';
import { TEST_CONSTANTS } from '../config/test-constants';
import { Constants } from '../../src/core/constants';

interface RequestOptions {
  statusCode?: number;
  auth?: 'admin' | 'none' | { token: string };
}

/**
 * Repository for Blogs endpoints.
 * Handles HTTP requests for blog management operations.
 */
export class BlogsRepository {
  constructor(private readonly httpServer: any) {}

  /**
   * Get all blogs with pagination, sorting, and filtering
   * GET /blogs
   *
   * @param query - Query parameters (pageNumber, pageSize, sortDirection, sortBy, searchNameTerm)
   * @param options - Request options (expected status code, auth)
   * @returns Paginated list of blogs
   */
  async getAll(
    query: {
      pageNumber?: number;
      pageSize?: number;
      sortDirection?: 'asc' | 'desc';
      sortBy?: string;
      searchNameTerm?: string;
    } = {},
    options: RequestOptions = {},
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const expectedStatus = options.statusCode ?? HttpStatus.OK;

    const response = await request(this.httpServer)
      .get(`/${Constants.GLOBAL_PREFIX}${Constants.PATH.BLOGS}`)
      .query(query)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * Get blog by ID
   * GET /blogs/:id
   *
   * @param id - Blog ID
   * @param options - Request options (expected status code)
   * @returns Blog view DTO
   */
  async getById(
    id: string,
    options: RequestOptions = {},
  ): Promise<BlogViewDto> {
    const expectedStatus = options.statusCode ?? HttpStatus.OK;

    const response = await request(this.httpServer)
      .get(`/${Constants.GLOBAL_PREFIX}${Constants.PATH.BLOGS}/${id}`)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * Create new blog (admin only)
   * POST /blogs
   *
   * @param data - Blog creation data
   * @param options - Request options (expected status code, auth)
   * @returns Created blog view DTO
   */
  async create(
    data: CreateBlogInputDto,
    options: RequestOptions = {},
  ): Promise<BlogViewDto> {
    const expectedStatus = options.statusCode ?? HttpStatus.CREATED;
    const auth = options.auth ?? 'admin';

    let req = request(this.httpServer)
      .post(`/${Constants.GLOBAL_PREFIX}${Constants.PATH.SA.BLOGS}`)
      .send(data);

    if (auth === 'admin') {
      req = req.auth(TEST_CONSTANTS.ADMIN.LOGIN, TEST_CONSTANTS.ADMIN.PASSWORD);
    } else if (auth !== 'none' && typeof auth === 'object') {
      req = req.set('Authorization', `Bearer ${auth.token}`);
    }

    const response = await req.expect(expectedStatus);

    return response.body;
  }

  /**
   * Update blog (admin only)
   * PUT /blogs/:id
   *
   * @param id - Blog ID
   * @param data - Blog update data
   * @param options - Request options (expected status code, auth)
   * @returns Response body (for error cases)
   */
  async update(
    id: string,
    data: UpdateBlogInputDto,
    options: RequestOptions = {},
  ): Promise<any> {
    const expectedStatus = options.statusCode ?? HttpStatus.NO_CONTENT;
    const auth = options.auth ?? 'admin';

    let req = request(this.httpServer)
      .put(`/${Constants.GLOBAL_PREFIX}${Constants.PATH.SA.BLOGS}/${id}`)
      .send(data);

    if (auth === 'admin') {
      req = req.auth(TEST_CONSTANTS.ADMIN.LOGIN, TEST_CONSTANTS.ADMIN.PASSWORD);
    } else if (auth !== 'none' && typeof auth === 'object') {
      req = req.set('Authorization', `Bearer ${auth.token}`);
    }

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  /**
   * Soft delete blog (admin only)
   * DELETE /blogs/:id
   *
   * @param id - Blog ID
   * @param options - Request options (expected status code, auth)
   * @returns Response body (for error cases)
   */
  async delete(id: string, options: RequestOptions = {}): Promise<any> {
    const expectedStatus = options.statusCode ?? HttpStatus.NO_CONTENT;
    const auth = options.auth ?? 'admin';

    let req = request(this.httpServer).delete(
      `/${Constants.GLOBAL_PREFIX}${Constants.PATH.SA.BLOGS}/${id}`,
    );

    if (auth === 'admin') {
      req = req.auth(TEST_CONSTANTS.ADMIN.LOGIN, TEST_CONSTANTS.ADMIN.PASSWORD);
    } else if (auth !== 'none' && typeof auth === 'object') {
      req = req.set('Authorization', `Bearer ${auth.token}`);
    }

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  /**
   * Get all posts for a specific blog
   * GET /blogs/:blogId/posts
   *
   * @param blogId - Blog ID
   * @param query - Query parameters (pageNumber, pageSize, sortDirection, sortBy)
   * @param options - Request options (expected status code, auth for like status)
   * @returns Paginated list of posts
   */
  async getPosts(
    blogId: string,
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
      .get(`/${Constants.GLOBAL_PREFIX}${Constants.PATH.BLOGS}/${blogId}/posts`)
      .query(query);

    if (auth && typeof auth === 'object') {
      req = req.set('Authorization', `Bearer ${auth.token}`);
    }

    const response = await req.expect(expectedStatus);

    return response.body;
  }

  /**
   * Create post for blog (admin only)
   * POST /blogs/:blogId/posts
   *
   * @param blogId - Blog ID
   * @param data - Post creation data
   * @param options - Request options (expected status code, auth)
   * @returns Created post view DTO
   */
  async createPost(
    blogId: string,
    data: CreatePostByBlogIdInputDto,
    options: RequestOptions = {},
  ): Promise<PostViewDto> {
    const expectedStatus = options.statusCode ?? HttpStatus.CREATED;
    const auth = options.auth ?? 'admin';

    let req = request(this.httpServer)
      .post(
        `/${Constants.GLOBAL_PREFIX}${Constants.PATH.SA.BLOGS}/${blogId}/posts`,
      )
      .send(data);

    if (auth === 'admin') {
      req = req.auth(TEST_CONSTANTS.ADMIN.LOGIN, TEST_CONSTANTS.ADMIN.PASSWORD);
    } else if (auth !== 'none' && typeof auth === 'object') {
      req = req.set('Authorization', `Bearer ${auth.token}`);
    }

    const response = await req.expect(expectedStatus);

    return response.body;
  }

  /**
   * Update post for blog (admin only)
   * PUT /sa/blogs/:blogId/posts/:postId
   */
  async updatePost(
    blogId: string,
    postId: string,
    data: UpdatePostInputDto,
    options: RequestOptions = {},
  ): Promise<any> {
    const expectedStatus = options.statusCode ?? HttpStatus.NO_CONTENT;
    const auth = options.auth ?? 'admin';

    let req = request(this.httpServer)
      .put(
        `/${Constants.GLOBAL_PREFIX}${Constants.PATH.SA.BLOGS}/${blogId}/posts/${postId}`,
      )
      .send(data);

    if (auth === 'admin') {
      req = req.auth(TEST_CONSTANTS.ADMIN.LOGIN, TEST_CONSTANTS.ADMIN.PASSWORD);
    } else if (auth !== 'none' && typeof auth === 'object') {
      req = req.set('Authorization', `Bearer ${auth.token}`);
    }

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  /**
   * Soft delete post for blog (admin only)
   * DELETE /sa/blogs/:blogId/posts/:postId
   */
  async deletePost(
    blogId: string,
    postId: string,
    options: RequestOptions = {},
  ): Promise<any> {
    const expectedStatus = options.statusCode ?? HttpStatus.NO_CONTENT;
    const auth = options.auth ?? 'admin';

    let req = request(this.httpServer).delete(
      `/${Constants.GLOBAL_PREFIX}${Constants.PATH.SA.BLOGS}/${blogId}/posts/${postId}`,
    );

    if (auth === 'admin') {
      req = req.auth(TEST_CONSTANTS.ADMIN.LOGIN, TEST_CONSTANTS.ADMIN.PASSWORD);
    } else if (auth !== 'none' && typeof auth === 'object') {
      req = req.set('Authorization', `Bearer ${auth.token}`);
    }

    const response = await req.expect(expectedStatus);
    return response.body;
  }
}
