import { AuthRepository } from './auth.repository';
import { UsersRepository } from '../users/users.repository';
import { authFactory } from './auth.factory';
import { usersFactory } from '../users/users.factory';
import { AuthContext } from './auth.types';

/**
 * Feature-specific helpers for auth testing.
 */

/**
 * Creates a user via admin endpoint and logs them in.
 * Returns complete auth context.
 *
 * @param usersRepository - Users repository instance
 * @param authRepository - Auth repository instance
 * @param login - Optional custom login
 * @param password - Optional custom password
 * @returns Complete auth context
 *
 * @example
 * const authContext = await createUserAndLogin(usersRepository, authRepository);
 * // Use authContext.accessToken, authContext.cookies, etc.
 */
export async function createUserAndLogin(
  usersRepository: UsersRepository,
  authRepository: AuthRepository,
  login?: string,
  password?: string,
): Promise<AuthContext> {
  // Use short login to stay within 10 char limit (usr + 6 digits = 9 chars)
  const userLogin = login ?? `usr${Date.now().toString().slice(-6)}`;
  const userPassword = password ?? 'password123';
  const userEmail = `${Date.now()}@example.com`; // Use timestamp for email to ensure uniqueness

  // Create user via admin endpoint
  const user = await usersRepository.create({
    login: userLogin,
    email: userEmail,
    password: userPassword,
  });

  // Login
  const loginResponse = await authRepository.login(userLogin, userPassword);

  return {
    login: userLogin,
    email: userEmail,
    password: userPassword,
    accessToken: loginResponse.body.accessToken,
    refreshToken: loginResponse.refreshToken,
    cookies: loginResponse.cookies,
    userId: user.id,
  };
}

/**
 * Creates multiple users and logs them all in.
 *
 * @param usersRepository - Users repository instance
 * @param authRepository - Auth repository instance
 * @param count - Number of users to create
 * @returns Array of auth contexts
 *
 * @example
 * const contexts = await createMultipleUsersAndLogin(usersRepository, authRepository, 3);
 */
export async function createMultipleUsersAndLogin(
  usersRepository: UsersRepository,
  authRepository: AuthRepository,
  count: number,
): Promise<AuthContext[]> {
  const contexts: AuthContext[] = [];

  for (let i = 0; i < count; i++) {
    // Use short login: usr + i + last 4 digits of timestamp (max 9 chars)
    const login = `usr${i}${Date.now().toString().slice(-4)}`;
    const context = await createUserAndLogin(
      usersRepository,
      authRepository,
      login,
    );
    contexts.push(context);
  }

  return contexts;
}

/**
 * Registers a user and returns their credentials.
 * Note: User email will not be confirmed.
 *
 * @param authRepository - Auth repository instance
 * @param login - Optional custom login
 * @returns Registration credentials
 *
 * @example
 * const credentials = await registerUser(authRepository);
 */
export async function registerUser(
  authRepository: AuthRepository,
  login?: string,
) {
  const registrationData = authFactory.createRegistrationData(
    login ? { login, email: `${login}@example.com` } : {},
  );

  await authRepository.register(registrationData);

  return {
    login: registrationData.login,
    email: registrationData.email,
    password: registrationData.password,
  };
}
