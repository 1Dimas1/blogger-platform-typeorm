import { MeViewDto } from '../../src/modules/user-accounts/api/view-dto/users.view-dto';
import { LoginResponse, RefreshTokenResponse } from './auth.repository';

/**
 * Validates that a login response has the correct structure.
 *
 * @param loginResponse - Login response to validate
 *
 * @example
 * const loginResponse = await authRepository.login('user', 'password');
 * expectValidLoginResponse(loginResponse);
 */
export function expectValidLoginResponse(loginResponse: LoginResponse) {
  expect(loginResponse.body).toBeDefined();
  expect(loginResponse.body.accessToken).toBeDefined();
  expect(typeof loginResponse.body.accessToken).toBe('string');
  expect(loginResponse.body.accessToken.length).toBeGreaterThan(0);

  expect(loginResponse.refreshToken).toBeDefined();
  expect(typeof loginResponse.refreshToken).toBe('string');

  expect(loginResponse.cookies).toBeDefined();
  expect(Array.isArray(loginResponse.cookies)).toBe(true);
  expect(loginResponse.cookies.length).toBeGreaterThan(0);
}

/**
 * Validates that a refresh token response has the correct structure.
 *
 * @param refreshResponse - Refresh token response to validate
 *
 * @example
 * const refreshResponse = await authRepository.refreshToken(cookies);
 * expectValidRefreshTokenResponse(refreshResponse);
 */
export function expectValidRefreshTokenResponse(
  refreshResponse: RefreshTokenResponse,
) {
  expect(refreshResponse.body).toBeDefined();
  expect(refreshResponse.body.accessToken).toBeDefined();
  expect(typeof refreshResponse.body.accessToken).toBe('string');

  expect(refreshResponse.refreshToken).toBeDefined();
  expect(typeof refreshResponse.refreshToken).toBe('string');

  expect(refreshResponse.cookies).toBeDefined();
  expect(Array.isArray(refreshResponse.cookies)).toBe(true);
}

/**
 * Validates that a MeViewDto has the correct structure.
 *
 * @param meDto - Me view DTO to validate
 *
 * @example
 * const me = await authRepository.me(accessToken);
 * expectValidMeResponse(me);
 */
export function expectValidMeResponse(meDto: MeViewDto) {
  expect(meDto.userId).toBeDefined();
  expect(meDto.login).toBeDefined();
  expect(meDto.email).toBeDefined();

  expect(typeof meDto.userId).toBe('string');
  expect(typeof meDto.login).toBe('string');
  expect(typeof meDto.email).toBe('string');
}

/**
 * Validates that the response is for an anonymous user.
 *
 * @param meDto - Me view DTO to validate
 *
 * @example
 * const me = await authRepository.meOrDefault();
 * expectAnonymousUser(me);
 */
export function expectAnonymousUser(meDto: MeViewDto) {
  expect(meDto.login).toBe('anonymous');
  expect(meDto.userId).toBeNull();
  expect(meDto.email).toBeNull();
}

/**
 * Validates that me response matches expected user data.
 *
 * @param meDto - Me view DTO
 * @param expectedLogin - Expected login
 * @param expectedEmail - Expected email
 *
 * @example
 * expectMeToMatchUser(me, 'testuser', 'test@example.com');
 */
export function expectMeToMatchUser(
  meDto: MeViewDto,
  expectedLogin: string,
  expectedEmail: string,
) {
  expect(meDto.login).toBe(expectedLogin);
  expect(meDto.email).toBe(expectedEmail);
  expect(meDto.userId).toBeDefined();
}
