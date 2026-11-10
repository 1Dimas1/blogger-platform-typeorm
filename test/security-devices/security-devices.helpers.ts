import { AuthRepository } from '../auth/auth.repository';
import { UsersRepository } from '../users/users.repository';
import { AuthContext } from '../auth/auth.types';
import { usersFactory } from '../users/users.factory';
import { delay } from '../utils/delay';
import { TEST_CONSTANTS } from '../config/test-constants';

/**
 * Creates multiple login sessions for the same user.
 * Each login creates a separate device session.
 *
 * @param usersRepository - Users repository instance
 * @param authRepository - Auth repository instance
 * @param count - Number of sessions to create
 * @returns Array of auth contexts, each representing a different device
 *
 * @example
 * const sessions = await createMultipleSessions(usersRepository, authRepository, 3);
 * // sessions[0], sessions[1], sessions[2] are different devices for same user
 */
export async function createMultipleSessions(
  usersRepository: UsersRepository,
  authRepository: AuthRepository,
  count: number,
): Promise<AuthContext[]> {
  // Create a single user
  const userData = usersFactory.createUserData();
  await usersRepository.create(userData);

  const sessions: AuthContext[] = [];

  // Login multiple times to create different device sessions
  for (let i = 0; i < count; i++) {
    // Small delay to ensure different timestamps
    if (i > 0) {
      await delay(TEST_CONSTANTS.DELAYS.BETWEEN_CREATIONS);
    }

    const loginResponse = await authRepository.login(
      userData.login,
      userData.password,
    );

    sessions.push({
      login: userData.login,
      email: userData.email,
      password: userData.password,
      accessToken: loginResponse.body.accessToken,
      refreshToken: loginResponse.refreshToken,
      cookies: loginResponse.cookies,
    });
  }

  return sessions;
}

/**
 * Extracts refresh token value from cookie array.
 *
 * @param cookies - Array of cookie strings
 * @returns Refresh token value or null if not found
 */
function extractRefreshTokenFromCookies(cookies: string[]): string | null {
  const refreshTokenCookie = cookies.find((cookie) =>
    cookie.startsWith('refreshToken='),
  );

  if (!refreshTokenCookie) return null;

  const match = refreshTokenCookie.match(/refreshToken=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Extracts deviceId from refresh token JWT.
 * Decodes the JWT without verification to extract the deviceId claim.
 *
 * @param cookies - Cookie array containing refresh token
 * @returns Device ID from the refresh token
 *
 * @example
 * const deviceId = extractDeviceId(authContext.cookies);
 */
export function extractDeviceId(cookies: string[]): string {
  const refreshToken = extractRefreshTokenFromCookies(cookies);
  if (!refreshToken) {
    throw new Error('Refresh token not found in cookies');
  }

  // Decode JWT without verification (just extract payload)
  // JWT format: header.payload.signature
  const parts = refreshToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const payload = JSON.parse(
    Buffer.from(parts[1], 'base64url').toString('utf-8'),
  );

  if (!payload.deviceId) {
    throw new Error('deviceId not found in refresh token payload');
  }

  return payload.deviceId;
}

/**
 * Helper to find a device session by deviceId from an array of sessions.
 *
 * @param sessions - Array of auth contexts
 * @param targetDeviceId - Device ID to find
 * @returns Auth context with matching deviceId or undefined
 *
 * @example
 * const session = findSessionByDeviceId(sessions, 'device-123');
 */
export function findSessionByDeviceId(
  sessions: AuthContext[],
  targetDeviceId: string,
): AuthContext | undefined {
  return sessions.find((session) => {
    const deviceId = extractDeviceId(session.cookies);
    return deviceId === targetDeviceId;
  });
}
