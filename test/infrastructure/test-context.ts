import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/users.view-dto';
import { CreateUserInputDto } from '../../src/modules/user-accounts/api/input-dto/create-user.input-dto';
import { UsersRepository } from '../users/users.repository';
import { AuthRepository } from '../auth/auth.repository';
import { usersFactory } from '../users/users.factory';

/**
 * TestContext represents a complete authenticated user session
 * with user data, access token, refresh token, and cookies.
 */
export interface TestContext {
  user: UserViewDto;
  accessToken: string;
  refreshToken?: string;
  cookies?: string[];
}

/**
 * Options for creating a test context
 */
export interface TestContextOptions {
  /**
   * Whether to create a user (default: true)
   */
  createUser?: boolean;

  /**
   * Whether to automatically login after creating user (default: true)
   */
  autoLogin?: boolean;

  /**
   * Custom user data to use when creating user
   */
  userData?: Partial<CreateUserInputDto>;
}

/**
 * Creates a complete authenticated test context with user, tokens, and cookies.
 *
 * @param httpServer - HTTP server from initSettings()
 * @param options - Configuration options
 * @returns TestContext with user, accessToken, refreshToken, and cookies
 *
 * @example
 * // Create authenticated user with default data
 * const context = await createTestContext(httpServer);
 * console.log(context.user, context.accessToken);
 *
 * @example
 * // Create user without login
 * const context = await createTestContext(httpServer, { autoLogin: false });
 *
 * @example
 * // Create user with custom data
 * const context = await createTestContext(httpServer, {
 *   userData: { login: 'customuser', email: 'custom@example.com' },
 * });
 */
export async function createTestContext(
  httpServer: any,
  options: TestContextOptions = {},
): Promise<TestContext> {
  const { createUser = true, autoLogin = true, userData = {} } = options;

  const usersRepository = new UsersRepository(httpServer);
  const authRepository = new AuthRepository(httpServer);

  // Create user
  let user: UserViewDto;
  if (createUser) {
    const userInput = usersFactory.createUserData(userData);
    user = await usersRepository.create(userInput);
  } else {
    throw new Error('createUser: false is not supported yet');
  }

  // Login if requested
  if (autoLogin) {
    const loginResponse = await authRepository.login(
      userData.login ?? user.login,
      userData.password ?? 'password123',
    );

    return {
      user,
      accessToken: loginResponse.body.accessToken,
      refreshToken: loginResponse.refreshToken ?? undefined,
      cookies: loginResponse.cookies,
    };
  } else {
    return {
      user,
      accessToken: '',
      refreshToken: undefined,
      cookies: undefined,
    };
  }
}

/**
 * Creates multiple authenticated test contexts.
 *
 * @param httpServer - HTTP server from initSettings()
 * @param count - Number of contexts to create
 * @param options - Configuration options
 * @returns Array of TestContexts
 *
 * @example
 * // Create 3 authenticated users
 * const contexts = await createMultipleTestContexts(httpServer, 3);
 * console.log(contexts[0].user, contexts[1].user, contexts[2].user);
 */
export async function createMultipleTestContexts(
  httpServer: any,
  count: number,
  options: TestContextOptions = {},
): Promise<TestContext[]> {
  const contexts: TestContext[] = [];

  for (let i = 0; i < count; i++) {
    const context = await createTestContext(httpServer, {
      ...options,
      userData: {
        ...options.userData,
        login: options.userData?.login
          ? `${options.userData.login}${i}`
          : `user${i}_${Date.now()}`,
        email: options.userData?.email
          ? `${options.userData.email.replace('@', `${i}@`)}`
          : `user${i}_${Date.now()}@example.com`,
      },
    });
    contexts.push(context);
  }

  return contexts;
}
