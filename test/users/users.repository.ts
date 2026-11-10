import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { CreateUserInputDto } from '../../src/modules/user-accounts/api/input-dto/create-user.input-dto';
import { UpdateUserInputDto } from '../../src/modules/user-accounts/api/input-dto/update-user.input-dto';
import { GetUsersQueryParams } from '../../src/modules/user-accounts/api/input-dto/get-users-query-params.input-dto';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/users.view-dto';
import { PaginatedViewDto } from '../../src/core/dto/base.paginated.view-dto';
import { Constants } from '../../src/core/constants';
import { TEST_CONSTANTS } from '../config/test-constants';

/**
 * Options for HTTP requests in users repository
 */
export interface RequestOptions {
  /**
   * Expected HTTP status code (default varies by method)
   */
  statusCode?: number;

  /**
   * Authentication method:
   * - 'admin': Use BasicAuth with admin credentials (default)
   * - 'none': No authentication
   * - { token: string }: Use JWT Bearer authentication
   */
  auth?: 'admin' | 'none' | { token: string };

  /**
   * Whether to expect an error response (don't throw on non-2xx status)
   */
  expectError?: boolean;
}

/**
 * Repository for users-related HTTP requests.
 * Encapsulates HTTP request logic for testing users endpoints.
 */
export class UsersRepository {
  constructor(private readonly httpServer: any) {}

  /**
   * Creates a new user (admin operation).
   *
   * @param data - User creation data
   * @param options - Request options
   * @returns Created user view DTO
   *
   * @example
   * const user = await usersRepository.create({
   *   login: 'testuser',
   *   email: 'test@example.com',
   *   password: 'password123',
   * });
   */
  async create(
    data: CreateUserInputDto,
    options: RequestOptions = {},
  ): Promise<UserViewDto> {
    const { statusCode = HttpStatus.CREATED, auth = 'admin' } = options;

    const req = request(this.httpServer)
      .post(`/${Constants.GLOBAL_PREFIX}${Constants.PATH.SA.USERS}`)
      .send(data);

    this.applyAuth(req, auth);

    const response = await req.expect(statusCode);
    return response.body;
  }

  /**
   * Gets all users with pagination, sorting, and filtering.
   *
   * @param query - Query parameters
   * @param options - Request options
   * @returns Paginated list of users
   *
   * @example
   * const users = await usersRepository.getAll({
   *   pageNumber: 1,
   *   pageSize: 10,
   *   searchLoginTerm: 'test',
   * });
   */
  async getAll(
    query: Partial<GetUsersQueryParams> = {},
    options: RequestOptions = {},
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const { statusCode = HttpStatus.OK, auth = 'admin' } = options;

    let url = `/${Constants.GLOBAL_PREFIX}${Constants.PATH.SA.USERS}`;
    const queryParams = new URLSearchParams();

    if (query.searchLoginTerm !== undefined && query.searchLoginTerm !== null) {
      queryParams.append('searchLoginTerm', query.searchLoginTerm);
    }
    if (query.searchEmailTerm !== undefined && query.searchEmailTerm !== null) {
      queryParams.append('searchEmailTerm', query.searchEmailTerm);
    }
    if (query.pageNumber !== undefined) {
      queryParams.append('pageNumber', query.pageNumber.toString());
    }
    if (query.pageSize !== undefined) {
      queryParams.append('pageSize', query.pageSize.toString());
    }
    if (query.sortBy !== undefined) {
      queryParams.append('sortBy', query.sortBy);
    }
    if (query.sortDirection !== undefined) {
      queryParams.append('sortDirection', query.sortDirection);
    }

    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const req = request(this.httpServer).get(url);

    this.applyAuth(req, auth);

    const response = await req.expect(statusCode);
    return response.body;
  }

  /**
   * Gets a user by ID.
   *
   * @param id - User ID
   * @param options - Request options
   * @returns User view DTO
   *
   * @example
   * const user = await usersRepository.getById('507f1f77bcf86cd799439011');
   */
  async getById(
    id: string,
    options: RequestOptions = {},
  ): Promise<UserViewDto> {
    const { statusCode = HttpStatus.OK, auth = 'admin' } = options;

    const req = request(this.httpServer).get(
      `/${Constants.GLOBAL_PREFIX}${Constants.PATH.SA.USERS}/${id}`,
    );

    this.applyAuth(req, auth);

    const response = await req.expect(statusCode);
    return response.body;
  }

  /**
   * Updates a user by ID.
   *
   * @param id - User ID
   * @param data - Update data
   * @param options - Request options
   * @returns Updated user view DTO
   *
   * @example
   * const user = await usersRepository.update('507f1f77bcf86cd799439011', {
   *   login: 'newlogin',
   * });
   */
  async update(
    id: string,
    data: UpdateUserInputDto,
    options: RequestOptions = {},
  ): Promise<UserViewDto> {
    const { statusCode = HttpStatus.OK, auth = 'admin' } = options;

    const req = request(this.httpServer)
      .put(`/${Constants.GLOBAL_PREFIX}${Constants.PATH.SA.USERS}/${id}`)
      .send(data);

    this.applyAuth(req, auth);

    const response = await req.expect(statusCode);
    return response.body;
  }

  /**
   * Deletes a user by ID (soft delete).
   *
   * @param id - User ID
   * @param options - Request options
   *
   * @example
   * await usersRepository.delete('507f1f77bcf86cd799439011');
   */
  async delete(id: string, options: RequestOptions = {}): Promise<void> {
    const { statusCode = HttpStatus.NO_CONTENT, auth = 'admin' } = options;

    const req = request(this.httpServer).delete(
      `/${Constants.GLOBAL_PREFIX}${Constants.PATH.SA.USERS}/${id}`,
    );

    this.applyAuth(req, auth);

    await req.expect(statusCode);
  }

  /**
   * Applies authentication to the request based on auth option.
   *
   * @param req - Supertest request object
   * @param auth - Authentication method
   * @private
   */
  private applyAuth(
    req: request.Test,
    auth: 'admin' | 'none' | { token: string },
  ): void {
    if (auth === 'admin') {
      req.auth(TEST_CONSTANTS.ADMIN.LOGIN, TEST_CONSTANTS.ADMIN.PASSWORD);
    } else if (auth !== 'none' && typeof auth === 'object') {
      req.auth(auth.token, { type: 'bearer' });
    }
    // If auth === 'none', do nothing (no authentication)
  }
}
