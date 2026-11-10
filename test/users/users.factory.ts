import { CreateUserInputDto } from '../../src/modules/user-accounts/api/input-dto/create-user.input-dto';
import { UpdateUserInputDto } from '../../src/modules/user-accounts/api/input-dto/update-user.input-dto';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/users.view-dto';
import { UsersRepository } from './users.repository';
import { TEST_CONSTANTS, TEST_HELPERS } from '../config/test-constants';
import { delay } from '../utils/delay';

/**
 * Factory for creating user test data.
 * Provides methods for generating valid/invalid user data and bulk creation utilities.
 */
export const usersFactory = {
  /**
   * Creates valid user data with sensible defaults and support for partial overrides.
   *
   * @param overrides - Partial user data to override defaults
   * @returns Complete CreateUserInputDto with defaults applied
   *
   * @example
   * // With defaults
   * const userData = usersFactory.createUserData();
   *
   * @example
   * // With overrides
   * const userData = usersFactory.createUserData({
   *   login: 'customuser',
   *   email: 'custom@example.com',
   * });
   */
  createUserData(
    overrides: Partial<CreateUserInputDto> = {},
  ): CreateUserInputDto {
    const data: CreateUserInputDto = {
      login: overrides.login ?? TEST_HELPERS.createUniqueLogin(),
      email: overrides.email ?? TEST_HELPERS.createUniqueEmail(),
      password: overrides.password ?? TEST_CONSTANTS.DEFAULT_USER.PASSWORD,
    };

    // Only include optional fields if they're explicitly provided
    if (overrides.firstName !== undefined) {
      data.firstName = overrides.firstName;
    }
    if (overrides.lastName !== undefined) {
      data.lastName = overrides.lastName;
    }

    return data;
  },

  /**
   * Creates user data that will fail validation.
   * Useful for testing validation error responses.
   *
   * @returns CreateUserInputDto with invalid values
   *
   * @example
   * const invalidData = usersFactory.createInvalidUserData();
   * await usersRepository.create(invalidData, { statusCode: 400 });
   */
  createInvalidUserData(): CreateUserInputDto {
    return {
      login: 'ab', // Too short (min: 3)
      email: TEST_HELPERS.createInvalidEmail(),
      password: '12345', // Too short (min: 6)
    };
  },

  /**
   * Creates user data with login that's too short (below minimum).
   *
   * @returns CreateUserInputDto with invalid login
   *
   * @example
   * const data = usersFactory.createUserDataWithShortLogin();
   */
  createUserDataWithShortLogin(
    overrides: Partial<CreateUserInputDto> = {},
  ): CreateUserInputDto {
    return this.createUserData({
      ...overrides,
      login: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.USER.LOGIN_MIN - 1,
      ),
    });
  },

  /**
   * Creates user data with login that's too long (above maximum).
   *
   * @returns CreateUserInputDto with invalid login
   *
   * @example
   * const data = usersFactory.createUserDataWithLongLogin();
   */
  createUserDataWithLongLogin(
    overrides: Partial<CreateUserInputDto> = {},
  ): CreateUserInputDto {
    return this.createUserData({
      ...overrides,
      login: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.USER.LOGIN_MAX + 1,
      ),
    });
  },

  /**
   * Creates user data with password that's too short (below minimum).
   *
   * @returns CreateUserInputDto with invalid password
   *
   * @example
   * const data = usersFactory.createUserDataWithShortPassword();
   */
  createUserDataWithShortPassword(
    overrides: Partial<CreateUserInputDto> = {},
  ): CreateUserInputDto {
    return this.createUserData({
      ...overrides,
      password: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.USER.PASSWORD_MIN - 1,
      ),
    });
  },

  /**
   * Creates user data with password that's too long (above maximum).
   *
   * @returns CreateUserInputDto with invalid password
   *
   * @example
   * const data = usersFactory.createUserDataWithLongPassword();
   */
  createUserDataWithLongPassword(
    overrides: Partial<CreateUserInputDto> = {},
  ): CreateUserInputDto {
    return this.createUserData({
      ...overrides,
      password: TEST_HELPERS.createString(
        TEST_CONSTANTS.VALIDATION.USER.PASSWORD_MAX + 1,
      ),
    });
  },

  /**
   * Creates valid update user data.
   *
   * @param overrides - Partial update data to override defaults
   * @returns Complete UpdateUserInputDto
   *
   * @example
   * const updateData = usersFactory.createUpdateUserData({ email: 'newemail@example.com' });
   */
  createUpdateUserData(
    overrides: Partial<UpdateUserInputDto> = {},
  ): UpdateUserInputDto {
    return {
      email: overrides.email ?? TEST_HELPERS.createUniqueEmail(),
    };
  },

  /**
   * Creates a user via the repository.
   *
   * @param repository - Users repository instance
   * @param overrides - Partial user data to override defaults
   * @returns Created user view DTO
   *
   * @example
   * const user = await usersFactory.createUser(usersRepository);
   *
   * @example
   * const user = await usersFactory.createUser(usersRepository, {
   *   login: 'testuser',
   *   email: 'test@example.com',
   * });
   */
  async createUser(
    repository: UsersRepository,
    overrides: Partial<CreateUserInputDto> = {},
  ): Promise<UserViewDto> {
    const userData = this.createUserData(overrides);
    return repository.create(userData);
  },

  /**
   * Creates multiple users via the repository with delays between creations.
   * The delays ensure distinct createdAt timestamps for reliable sorting tests.
   *
   * @param count - Number of users to create
   * @param repository - Users repository instance
   * @param baseOverrides - Base overrides applied to all users
   * @returns Array of created user view DTOs
   *
   * @example
   * const users = await usersFactory.createMultipleUsers(10, usersRepository);
   */
  async createMultipleUsers(
    count: number,
    repository: UsersRepository,
    baseOverrides: Partial<CreateUserInputDto> = {},
  ): Promise<UserViewDto[]> {
    const users: UserViewDto[] = [];

    for (let i = 0; i < count; i++) {
      // Add delay before creating (except first) to ensure unique timestamps
      if (i > 0) {
        await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
      }

      const user = await this.createUser(repository, {
        ...baseOverrides,
        // Use createUniqueLogin() which stays within 10 char limit (u + 8 digits = 9 chars)
        // Don't pass custom prefix to avoid exceeding limit
        login: baseOverrides.login ? `${baseOverrides.login}${i}` : undefined, // Will use default from createUserData which calls createUniqueLogin()
        email: baseOverrides.email
          ? `${baseOverrides.email.replace('@', `${i}@`)}`
          : undefined, // Will use default from createUserData which calls createUniqueEmail()
      });

      users.push(user);
    }

    return users;
  },
};
