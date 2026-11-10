import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/users.view-dto';
import { CreateUserInputDto } from '../../src/modules/user-accounts/api/input-dto/create-user.input-dto';
import {
  expectValidISODateString,
  expectValidUUID,
} from '../infrastructure/expect-helpers';

/**
 * Validates that a user has the correct shape/structure.
 *
 * @param user - User view DTO to validate
 *
 * @example
 * const user = await usersRepository.create(userData);
 * expectValidUserShape(user);
 */
export function expectValidUserShape(user: UserViewDto) {
  expect(typeof user.id).toBe('string');
  expect(typeof user.login).toBe('string');
  expect(typeof user.email).toBe('string');
  expect(typeof user.createdAt).toBe('string');

  expectValidUUID(user.id);
  expectValidISODateString(user.createdAt);

  // Ensure password is not exposed
  expect((user as any).password).toBeUndefined();
  expect((user as any).passwordHash).toBeUndefined();
  expect((user as any).passwordSalt).toBeUndefined();

  // Check optional fields (firstName, lastName can be null or string)
  if (user.firstName !== null && user.firstName !== undefined) {
    expect(typeof user.firstName).toBe('string');
  }
  if (user.lastName !== null && user.lastName !== undefined) {
    expect(typeof user.lastName).toBe('string');
  }
}

/**
 * Validates that a created user matches the input data used to create it.
 *
 * @param user - Created user view DTO
 * @param input - Input data used to create the user
 *
 * @example
 * const userData = usersFactory.createUserData();
 * const user = await usersRepository.create(userData);
 * expectUserToMatchInput(user, userData);
 */
export function expectUserToMatchInput(
  user: UserViewDto,
  input: CreateUserInputDto,
) {
  expect(user.login).toBe(input.login);
  expect(user.email).toBe(input.email);

  // Password should NOT be in response
  expect((user as any).password).toBeUndefined();

  // firstName/lastName are not part of the swagger UserViewModel
  expect(user).not.toHaveProperty('firstName');
  expect(user).not.toHaveProperty('lastName');
}

/**
 * Validates that two users match exactly.
 *
 * @param actual - Actual user
 * @param expected - Expected user
 *
 * @example
 * const user1 = await usersRepository.getById(userId);
 * const user2 = await usersRepository.getById(userId);
 * expectUsersToMatch(user1, user2);
 */
export function expectUsersToMatch(actual: UserViewDto, expected: UserViewDto) {
  expect(actual.id).toBe(expected.id);
  expect(actual.login).toBe(expected.login);
  expect(actual.email).toBe(expected.email);
  expect(actual.createdAt).toBe(expected.createdAt);
  expect(actual.firstName).toBe(expected.firstName);
  expect(actual.lastName).toBe(expected.lastName);
}

/**
 * Validates that a user's login matches the expected value.
 *
 * @param user - User view DTO
 * @param expectedLogin - Expected login value
 *
 * @example
 * expectUserLogin(user, 'testuser');
 */
export function expectUserLogin(user: UserViewDto, expectedLogin: string) {
  expect(user.login).toBe(expectedLogin);
}

/**
 * Validates that a user's email matches the expected value.
 *
 * @param user - User view DTO
 * @param expectedEmail - Expected email value
 *
 * @example
 * expectUserEmail(user, 'test@example.com');
 */
export function expectUserEmail(user: UserViewDto, expectedEmail: string) {
  expect(user.email).toBe(expectedEmail);
}

/**
 * Validates that a user array contains a user with the specified login.
 *
 * @param users - Array of users
 * @param login - Login to search for
 *
 * @example
 * const users = await usersRepository.getAll();
 * expectUsersToIncludeLogin(users.items, 'testuser');
 */
export function expectUsersToIncludeLogin(users: UserViewDto[], login: string) {
  const found = users.find((u) => u.login === login);
  expect(found).toBeDefined();
  expect(found?.login).toBe(login);
}

/**
 * Validates that a user array does NOT contain a user with the specified login.
 *
 * @param users - Array of users
 * @param login - Login to search for
 *
 * @example
 * const users = await usersRepository.getAll({ searchLoginTerm: 'admin' });
 * expectUsersToNotIncludeLogin(users.items, 'testuser');
 */
export function expectUsersToNotIncludeLogin(
  users: UserViewDto[],
  login: string,
) {
  const found = users.find((u) => u.login === login);
  expect(found).toBeUndefined();
}
