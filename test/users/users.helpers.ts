import { UsersRepository } from './users.repository';
import { usersFactory } from './users.factory';
import { UserWithCredentials } from './users.types';

/**
 * Feature-specific helpers for users testing.
 * These are higher-level helpers that combine multiple operations.
 */

/**
 * Creates a user and returns both the user data and the credentials.
 * Useful when you need to login with the user later.
 *
 * @param repository - Users repository instance
 * @param login - Optional custom login
 * @param password - Optional custom password
 * @returns User data with credentials
 *
 * @example
 * const { user, login, password } = await createUserWithCredentials(usersRepository);
 * // Later: login with these credentials
 * const tokens = await authRepository.login(login, password);
 */
export async function createUserWithCredentials(
  repository: UsersRepository,
  login?: string,
  password?: string,
): Promise<UserWithCredentials> {
  const userLogin = login ?? `user${Date.now()}`;
  const userPassword = password ?? 'password123';

  const user = await usersFactory.createUser(repository, {
    login: userLogin,
    password: userPassword,
  });

  return {
    user,
    login: userLogin,
    password: userPassword,
  };
}

/**
 * Creates multiple users and returns them with their credentials.
 *
 * @param repository - Users repository instance
 * @param count - Number of users to create
 * @returns Array of users with credentials
 *
 * @example
 * const usersWithCreds = await createMultipleUsersWithCredentials(usersRepository, 3);
 * // Later: login with first user
 * const tokens = await authRepository.login(usersWithCreds[0].login, usersWithCreds[0].password);
 */
export async function createMultipleUsersWithCredentials(
  repository: UsersRepository,
  count: number,
): Promise<UserWithCredentials[]> {
  const usersWithCreds: UserWithCredentials[] = [];

  for (let i = 0; i < count; i++) {
    const userWithCreds = await createUserWithCredentials(
      repository,
      `user${i}_${Date.now()}`,
      'password123',
    );
    usersWithCreds.push(userWithCreds);
  }

  return usersWithCreds;
}

/**
 * Setup function for tests that need a clean slate with a specific number of users.
 *
 * @param repository - Users repository instance
 * @param count - Number of users to create
 * @returns Array of created users
 *
 * @example
 * beforeEach(async () => {
 *   await deleteAllData(app);
 *   users = await setupUsersForTest(usersRepository, 10);
 * });
 */
export async function setupUsersForTest(
  repository: UsersRepository,
  count: number = 5,
) {
  return usersFactory.createMultipleUsers(count, repository);
}
