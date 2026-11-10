import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../infrastructure/init-settings';
import { deleteAllData } from '../utils/delete-all-data';
import { UsersRepository } from './users.repository';
import { usersFactory } from './users.factory';
import {
  expectValidUserShape,
  expectUserToMatchInput,
  expectUsersToMatch,
  expectUsersToIncludeLogin,
  expectUsersToNotIncludeLogin,
} from './users.expectations';
import {
  expectValidPaginatedResponse,
  expectValidationErrors,
  expectSortedBy,
} from '../infrastructure/expect-helpers';
import { TEST_CONSTANTS, TEST_HELPERS } from '../config/test-constants';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/users.view-dto';
import { createTestContext } from '../infrastructure/test-context';
import { UsersSortBy } from '../../src/modules/user-accounts/api/input-dto/users-sort-by';
import { SortDirection } from '../../src/core/dto/base.query-params.input-dto';

describe('Users', () => {
  let app: INestApplication;
  let httpServer: any;
  let usersRepository: UsersRepository;

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    httpServer = result.httpServer;
    usersRepository = result.usersRepository;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  describe('POST /users (Create User)', () => {
    describe('Success cases', () => {
      it('should create user with valid data', async () => {
        const userData = usersFactory.createUserData();

        const user = await usersRepository.create(userData);

        expectValidUserShape(user);
        expectUserToMatchInput(user, userData);
      });

      it('should create user with minimum valid login length (3 chars)', async () => {
        const userData = usersFactory.createUserData({
          login: TEST_HELPERS.createString(
            TEST_CONSTANTS.VALIDATION.USER.LOGIN_MIN,
          ),
        });

        const user = await usersRepository.create(userData);

        expect(user.login).toBe(userData.login);
        expect(user.login.length).toBe(
          TEST_CONSTANTS.VALIDATION.USER.LOGIN_MIN,
        );
      });

      it('should create user with maximum valid login length (10 chars)', async () => {
        const userData = usersFactory.createUserData({
          login: TEST_HELPERS.createString(
            TEST_CONSTANTS.VALIDATION.USER.LOGIN_MAX,
          ),
        });

        const user = await usersRepository.create(userData);

        expect(user.login).toBe(userData.login);
        expect(user.login.length).toBe(
          TEST_CONSTANTS.VALIDATION.USER.LOGIN_MAX,
        );
      });

      it('should create user with minimum valid password length (6 chars)', async () => {
        const userData = usersFactory.createUserData({
          password: TEST_HELPERS.createString(
            TEST_CONSTANTS.VALIDATION.USER.PASSWORD_MIN,
          ),
        });

        const user = await usersRepository.create(userData);

        expectValidUserShape(user);
      });

      it('should create user with maximum valid password length (20 chars)', async () => {
        const userData = usersFactory.createUserData({
          password: TEST_HELPERS.createString(
            TEST_CONSTANTS.VALIDATION.USER.PASSWORD_MAX,
          ),
        });

        const user = await usersRepository.create(userData);

        expectValidUserShape(user);
      });

      it('should create user with optional firstName and lastName', async () => {
        const userData = usersFactory.createUserData({
          firstName: 'John',
          lastName: 'Doe',
        });

        const user = await usersRepository.create(userData);

        expect(user).not.toHaveProperty('firstName');
        expect(user).not.toHaveProperty('lastName');
      });

      it('should create user without firstName and lastName', async () => {
        const userData = usersFactory.createUserData();

        const user = await usersRepository.create(userData);

        expect(user).not.toHaveProperty('firstName');
        expect(user).not.toHaveProperty('lastName');
      });

      it('should not expose password in response', async () => {
        const userData = usersFactory.createUserData();

        const user = await usersRepository.create(userData);

        expect((user as any).password).toBeUndefined();
        expect((user as any).passwordHash).toBeUndefined();
        expect((user as any).passwordSalt).toBeUndefined();
      });
    });

    describe('Validation errors', () => {
      it('should return 400 when login is too short (below 3 chars)', async () => {
        const userData = usersFactory.createUserDataWithShortLogin();

        const response = await usersRepository.create(userData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });

        expectValidationErrors(response, ['login']);
      });

      it('should return 400 when login is too long (above 10 chars)', async () => {
        const userData = usersFactory.createUserDataWithLongLogin();

        const response = await usersRepository.create(userData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });

        expectValidationErrors(response, ['login']);
      });

      it('should return 400 when password is too short (below 6 chars)', async () => {
        const userData = usersFactory.createUserDataWithShortPassword();

        const response = await usersRepository.create(userData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });

        expectValidationErrors(response, ['password']);
      });

      it('should return 400 when password is too long (above 20 chars)', async () => {
        const userData = usersFactory.createUserDataWithLongPassword();

        const response = await usersRepository.create(userData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });

        expectValidationErrors(response, ['password']);
      });

      it('should return 400 when email format is invalid', async () => {
        const userData = usersFactory.createUserData({
          email: TEST_HELPERS.createInvalidEmail(),
        });

        const response = await usersRepository.create(userData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });

        expectValidationErrors(response, ['email']);
      });

      it('should return 400 when login is empty', async () => {
        const userData = usersFactory.createUserData({
          login: '',
        });

        const response = await usersRepository.create(userData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });

        expectValidationErrors(response, ['login']);
      });

      it('should return 400 when email is empty', async () => {
        const userData = usersFactory.createUserData({
          email: '',
        });

        const response = await usersRepository.create(userData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });

        expectValidationErrors(response, ['email']);
      });

      it('should return 400 when password is empty', async () => {
        const userData = usersFactory.createUserData({
          password: '',
        });

        const response = await usersRepository.create(userData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });

        expectValidationErrors(response, ['password']);
      });

      it('should return 400 when multiple fields are invalid', async () => {
        const userData = usersFactory.createInvalidUserData();

        const response = await usersRepository.create(userData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });

        expectValidationErrors(response, ['login', 'email', 'password']);
      });

      it('should return 400 when login already exists', async () => {
        const userData = usersFactory.createUserData({ login: 'testuser1' });
        await usersRepository.create(userData);

        const duplicateData = usersFactory.createUserData({
          login: 'testuser1',
        });
        const response = await usersRepository.create(duplicateData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });

        expect(response).toHaveProperty('message');
      });

      it('should return 400 when email already exists', async () => {
        const userData = usersFactory.createUserData({
          email: 'existing@example.com',
        });
        await usersRepository.create(userData);

        const duplicateData = usersFactory.createUserData({
          email: 'existing@example.com',
        });
        const response = await usersRepository.create(duplicateData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });

        expect(response).toHaveProperty('message');
      });
    });

    describe('Authentication', () => {
      it('should require admin authentication', async () => {
        const userData = usersFactory.createUserData();

        await usersRepository.create(userData, {
          statusCode: HttpStatus.UNAUTHORIZED,
          auth: 'none',
        });
      });

      it('should reject user JWT token (admin only)', async () => {
        const context = await createTestContext(httpServer);
        const userData = usersFactory.createUserData();

        await usersRepository.create(userData, {
          statusCode: HttpStatus.UNAUTHORIZED,
          auth: { token: context.accessToken },
        });
      });
    });
  });

  describe('GET /users (Get All Users)', () => {
    describe('Pagination', () => {
      it('should return paginated users with default values', async () => {
        await usersFactory.createMultipleUsers(15, usersRepository);

        const result = await usersRepository.getAll();

        expectValidPaginatedResponse(result, 1, 10);
        expect(result.totalCount).toBe(15);
        expect(result.pagesCount).toBe(2);
        expect(result.items).toHaveLength(10);
      });

      it('should return second page with correct items', async () => {
        await usersFactory.createMultipleUsers(15, usersRepository);

        const result = await usersRepository.getAll({
          pageNumber: 2,
          pageSize: 10,
        });

        expectValidPaginatedResponse(result, 2, 10);
        expect(result.items).toHaveLength(5);
      });

      it('should respect custom page size', async () => {
        await usersFactory.createMultipleUsers(15, usersRepository);

        const result = await usersRepository.getAll({
          pageNumber: 1,
          pageSize: 5,
        });

        expectValidPaginatedResponse(result, 1, 5);
        expect(result.items).toHaveLength(5);
        expect(result.pagesCount).toBe(3);
      });

      it('should return empty array for page beyond available data', async () => {
        await usersFactory.createMultipleUsers(10, usersRepository);

        const result = await usersRepository.getAll({
          pageNumber: 5,
          pageSize: 10,
        });

        expect(result.items).toHaveLength(0);
        expect(result.totalCount).toBe(10);
      });
    });

    describe('Sorting', () => {
      it('should sort by createdAt descending by default', async () => {
        await usersFactory.createMultipleUsers(5, usersRepository);

        const result = await usersRepository.getAll();

        expectSortedBy(result.items, 'desc', (user) =>
          new Date(user.createdAt).getTime(),
        );
      });

      it('should sort by createdAt ascending', async () => {
        await usersFactory.createMultipleUsers(5, usersRepository);

        const result = await usersRepository.getAll({
          sortBy: UsersSortBy.CreatedAt,
          sortDirection: SortDirection.Asc,
        });

        expectSortedBy(result.items, 'asc', (user) =>
          new Date(user.createdAt).getTime(),
        );
      });

      it('should sort by login ascending', async () => {
        await usersRepository.create(
          usersFactory.createUserData({ login: 'charlie' }),
        );
        await usersRepository.create(
          usersFactory.createUserData({ login: 'alice' }),
        );
        await usersRepository.create(
          usersFactory.createUserData({ login: 'bob' }),
        );

        const result = await usersRepository.getAll({
          sortBy: UsersSortBy.Login,
          sortDirection: SortDirection.Asc,
        });

        expect(result.items[0].login).toBe('alice');
        expect(result.items[1].login).toBe('bob');
        expect(result.items[2].login).toBe('charlie');
      });

      it('should sort by login descending', async () => {
        await usersRepository.create(
          usersFactory.createUserData({ login: 'charlie' }),
        );
        await usersRepository.create(
          usersFactory.createUserData({ login: 'alice' }),
        );
        await usersRepository.create(
          usersFactory.createUserData({ login: 'bob' }),
        );

        const result = await usersRepository.getAll({
          sortBy: UsersSortBy.Login,
          sortDirection: SortDirection.Desc,
        });

        expect(result.items[0].login).toBe('charlie');
        expect(result.items[1].login).toBe('bob');
        expect(result.items[2].login).toBe('alice');
      });
    });

    describe('Filtering', () => {
      beforeEach(async () => {
        await usersRepository.create(
          usersFactory.createUserData({
            login: 'alice123',
            email: 'alice@example.com',
          }),
        );
        await usersRepository.create(
          usersFactory.createUserData({
            login: 'bob456',
            email: 'bob@test.com',
          }),
        );
        await usersRepository.create(
          usersFactory.createUserData({
            login: 'charlie789',
            email: 'charlie@example.com',
          }),
        );
      });

      it('should filter users by searchLoginTerm', async () => {
        const result = await usersRepository.getAll({
          searchLoginTerm: 'alice',
        });

        expect(result.totalCount).toBe(1);
        expect(result.items[0].login).toBe('alice123');
      });

      it('should filter users by searchLoginTerm (partial match)', async () => {
        const result = await usersRepository.getAll({
          searchLoginTerm: '123',
        });

        expect(result.totalCount).toBe(1);
        expectUsersToIncludeLogin(result.items, 'alice123');
      });

      it('should filter users by searchEmailTerm', async () => {
        const result = await usersRepository.getAll({
          searchEmailTerm: 'example',
        });

        expect(result.totalCount).toBe(2);
        expectUsersToIncludeLogin(result.items, 'alice123');
        expectUsersToIncludeLogin(result.items, 'charlie789');
        expectUsersToNotIncludeLogin(result.items, 'bob456');
      });

      it('should return empty array when searchLoginTerm matches no users', async () => {
        const result = await usersRepository.getAll({
          searchLoginTerm: 'nonexistent',
        });

        expect(result.totalCount).toBe(0);
        expect(result.items).toHaveLength(0);
      });

      it('should return empty array when searchEmailTerm matches no users', async () => {
        const result = await usersRepository.getAll({
          searchEmailTerm: 'nonexistent',
        });

        expect(result.totalCount).toBe(0);
        expect(result.items).toHaveLength(0);
      });

      it('should perform case-insensitive search for searchLoginTerm', async () => {
        const result = await usersRepository.getAll({
          searchLoginTerm: 'ALICE',
        });

        expect(result.totalCount).toBe(1);
        expect(result.items[0].login).toBe('alice123');
      });

      it('should perform case-insensitive search for searchEmailTerm', async () => {
        const result = await usersRepository.getAll({
          searchEmailTerm: 'EXAMPLE',
        });

        expect(result.totalCount).toBe(2);
      });
    });

    describe('Combined pagination + sorting + filtering', () => {
      beforeEach(async () => {
        await usersFactory.createMultipleUsers(20, usersRepository);
      }, 10000); // Increase timeout to 10 seconds for creating 20 users

      it('should handle searchLoginTerm with pagination', async () => {
        const result = await usersRepository.getAll({
          searchLoginTerm: 'user',
          pageNumber: 2,
          pageSize: 5,
        });

        expect(result.page).toBe(2);
        expect(result.pageSize).toBe(5);
        expect(result.items.length).toBeLessThanOrEqual(5);
      });

      it('should handle searchLoginTerm with sorting', async () => {
        const result = await usersRepository.getAll({
          searchLoginTerm: 'user',
          sortBy: UsersSortBy.CreatedAt,
          sortDirection: SortDirection.Asc,
        });

        expectSortedBy(result.items, 'asc', (user) =>
          new Date(user.createdAt).getTime(),
        );
      });

      it('should handle pagination + sorting + filtering together', async () => {
        const result = await usersRepository.getAll({
          searchLoginTerm: 'user',
          pageNumber: 1,
          pageSize: 5,
          sortBy: UsersSortBy.CreatedAt,
          sortDirection: SortDirection.Desc,
        });

        expectValidPaginatedResponse(result, 1, 5);
        expectSortedBy(result.items, 'desc', (user) =>
          new Date(user.createdAt).getTime(),
        );
      });
    });

    describe('Authentication', () => {
      it('should require admin authentication', async () => {
        await usersRepository.getAll(
          {},
          {
            statusCode: HttpStatus.UNAUTHORIZED,
            auth: 'none',
          },
        );
      });
    });
  });

  describe('GET /users/:id (Get User By ID)', () => {
    it('should get user by ID', async () => {
      const createdUser = await usersFactory.createUser(usersRepository);

      const user = await usersRepository.getById(createdUser.id);

      expectUsersToMatch(user, createdUser);
    });

    it('should return 404 when user not found', async () => {
      const nonExistentId = TEST_HELPERS.createNonExistentId();

      await usersRepository.getById(nonExistentId, {
        statusCode: HttpStatus.NOT_FOUND,
      });
    });

    it('should not return soft-deleted user', async () => {
      const user = await usersFactory.createUser(usersRepository);
      await usersRepository.delete(user.id);

      await usersRepository.getById(user.id, {
        statusCode: HttpStatus.NOT_FOUND,
      });
    });

    it('should require admin authentication', async () => {
      const user = await usersFactory.createUser(usersRepository);

      await usersRepository.getById(user.id, {
        statusCode: HttpStatus.UNAUTHORIZED,
        auth: 'none',
      });
    });
  });

  describe('PUT /users/:id (Update User)', () => {
    let existingUser: UserViewDto;

    beforeEach(async () => {
      existingUser = await usersFactory.createUser(usersRepository);
    });

    it('should update user email', async () => {
      const updateData = usersFactory.createUpdateUserData({
        email: 'newemail@example.com',
      });

      const updatedUser = await usersRepository.update(
        existingUser.id,
        updateData,
      );

      expect(updatedUser.email).toBe('newemail@example.com');
    });

    it('should return 404 when user not found', async () => {
      const nonExistentId = TEST_HELPERS.createNonExistentId();
      const updateData = usersFactory.createUpdateUserData({
        email: 'newemail@example.com',
      });

      await usersRepository.update(nonExistentId, updateData, {
        statusCode: HttpStatus.NOT_FOUND,
      });
    });

    it('should require admin authentication', async () => {
      const updateData = usersFactory.createUpdateUserData({
        email: 'newemail@example.com',
      });

      await usersRepository.update(existingUser.id, updateData, {
        statusCode: HttpStatus.UNAUTHORIZED,
        auth: 'none',
      });
    });
  });

  describe('DELETE /users/:id (Delete User)', () => {
    let existingUser: UserViewDto;

    beforeEach(async () => {
      existingUser = await usersFactory.createUser(usersRepository);
    });

    it('should soft delete user', async () => {
      await usersRepository.delete(existingUser.id);

      // User should not be in listings
      const users = await usersRepository.getAll();
      expectUsersToNotIncludeLogin(users.items, existingUser.login);
    });

    it('should return 404 when getting deleted user by ID', async () => {
      await usersRepository.delete(existingUser.id);

      await usersRepository.getById(existingUser.id, {
        statusCode: HttpStatus.NOT_FOUND,
      });
    });

    it('should return 404 when user not found', async () => {
      const nonExistentId = TEST_HELPERS.createNonExistentId();

      await usersRepository.delete(nonExistentId, {
        statusCode: HttpStatus.NOT_FOUND,
      });
    });

    it('should require admin authentication', async () => {
      await usersRepository.delete(existingUser.id, {
        statusCode: HttpStatus.UNAUTHORIZED,
        auth: 'none',
      });
    });

    it('should not affect other users when deleting one user', async () => {
      const user1 = await usersFactory.createUser(usersRepository);
      const user2 = await usersFactory.createUser(usersRepository);

      await usersRepository.delete(user1.id);

      const users = await usersRepository.getAll();
      expectUsersToNotIncludeLogin(users.items, user1.login);
      expectUsersToIncludeLogin(users.items, user2.login);
    });
  });
});
