import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { Constants } from '../../src/core/constants';
import { extractCookies, extractRefreshToken } from '../utils/cookie-parser';
import { CreateUserInputDto } from '../../src/modules/user-accounts/api/input-dto/create-user.input-dto';
import { MeViewDto } from '../../src/modules/user-accounts/api/view-dto/users.view-dto';

/**
 * Options for HTTP requests in auth repository
 */
export interface RequestOptions {
  statusCode?: number;
  expectError?: boolean;
}

/**
 * Login response with tokens and cookies
 */
export interface LoginResponse {
  body: {
    accessToken: string;
  };
  refreshToken: string | null;
  cookies: string[];
  response: request.Response;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  body: {
    accessToken: string;
  };
  refreshToken: string | null;
  cookies: string[];
  response: request.Response;
}

/**
 * Repository for auth-related HTTP requests.
 * Encapsulates HTTP request logic for testing auth endpoints.
 */
export class AuthRepository {
  constructor(private readonly httpServer: any) {}

  /**
   * Register a new user.
   *
   * @param data - Registration data
   * @param options - Request options
   *
   * @example
   * await authRepository.register({
   *   login: 'newuser',
   *   email: 'newuser@example.com',
   *   password: 'password123',
   * });
   */
  async register(
    data: CreateUserInputDto,
    options: RequestOptions = {},
  ): Promise<void> {
    const { statusCode = HttpStatus.NO_CONTENT } = options;

    await request(this.httpServer)
      .post(`/${Constants.GLOBAL_PREFIX}/auth/registration`)
      .send(data)
      .expect(statusCode);
  }

  /**
   * Confirm registration with confirmation code.
   *
   * @param code - Confirmation code
   * @param options - Request options
   *
   * @example
   * await authRepository.confirmRegistration('abc123');
   */
  async confirmRegistration(
    code: string,
    options: RequestOptions = {},
  ): Promise<void> {
    const { statusCode = HttpStatus.NO_CONTENT } = options;

    await request(this.httpServer)
      .post(`/${Constants.GLOBAL_PREFIX}/auth/registration-confirmation`)
      .send({ code })
      .expect(statusCode);
  }

  /**
   * Resend confirmation email.
   *
   * @param email - User email
   * @param options - Request options
   *
   * @example
   * await authRepository.resendConfirmationEmail('user@example.com');
   */
  async resendConfirmationEmail(
    email: string,
    options: RequestOptions = {},
  ): Promise<void> {
    const { statusCode = HttpStatus.NO_CONTENT } = options;

    await request(this.httpServer)
      .post(`/${Constants.GLOBAL_PREFIX}/auth/registration-email-resending`)
      .send({ email })
      .expect(statusCode);
  }

  /**
   * Login with credentials.
   *
   * @param loginOrEmail - User login or email
   * @param password - User password
   * @param options - Request options
   * @returns Login response with access token and refresh token cookie
   *
   * @example
   * const loginResponse = await authRepository.login('user', 'password123');
   * console.log(loginResponse.body.accessToken);
   * console.log(loginResponse.refreshToken);
   */
  async login(
    loginOrEmail: string,
    password: string,
    options: RequestOptions = {},
  ): Promise<LoginResponse> {
    const { statusCode = HttpStatus.OK } = options;

    const response = await request(this.httpServer)
      .post(`/${Constants.GLOBAL_PREFIX}/auth/login`)
      .set('User-Agent', 'node-superagent/test')
      .send({ loginOrEmail, password })
      .expect(statusCode);

    const refreshToken = extractRefreshToken(response);
    const cookies = extractCookies(response);

    return {
      body: response.body,
      refreshToken,
      cookies,
      response,
    };
  }

  /**
   * Get current user info (requires valid JWT).
   *
   * @param accessToken - JWT access token
   * @param options - Request options
   * @returns User info
   *
   * @example
   * const userInfo = await authRepository.me(accessToken);
   */
  async me(
    accessToken: string,
    options: RequestOptions = {},
  ): Promise<MeViewDto> {
    const { statusCode = HttpStatus.OK } = options;

    const response = await request(this.httpServer)
      .get(`/${Constants.GLOBAL_PREFIX}/auth/me`)
      .auth(accessToken, { type: 'bearer' })
      .expect(statusCode);

    return response.body;
  }

  /**
   * Get current user info or default anonymous user (optional JWT).
   *
   * @param accessToken - Optional JWT access token
   * @param options - Request options
   * @returns User info or anonymous user
   *
   * @example
   * const userInfo = await authRepository.meOrDefault(accessToken);
   * const anonymous = await authRepository.meOrDefault();
   */
  async meOrDefault(
    accessToken?: string,
    options: RequestOptions = {},
  ): Promise<MeViewDto> {
    const { statusCode = HttpStatus.OK } = options;

    const req = request(this.httpServer).get(
      `/${Constants.GLOBAL_PREFIX}/auth/me-or-default`,
    );

    if (accessToken) {
      req.auth(accessToken, { type: 'bearer' });
    }

    const response = await req.expect(statusCode);
    return response.body;
  }

  /**
   * Refresh access and refresh tokens.
   *
   * @param cookies - Cookies from login/previous refresh (containing refreshToken)
   * @param options - Request options
   * @returns New tokens
   *
   * @example
   * const loginResponse = await authRepository.login('user', 'password');
   * const newTokens = await authRepository.refreshToken(loginResponse.cookies);
   */
  async refreshToken(
    cookies: string[],
    options: RequestOptions = {},
  ): Promise<RefreshTokenResponse> {
    const { statusCode = HttpStatus.OK } = options;

    const response = await request(this.httpServer)
      .post(`/${Constants.GLOBAL_PREFIX}/auth/refresh-token`)
      .set('Cookie', cookies)
      .expect(statusCode);

    const refreshToken = extractRefreshToken(response);
    const newCookies = extractCookies(response);

    return {
      body: response.body,
      refreshToken,
      cookies: newCookies,
      response,
    };
  }

  /**
   * Logout (invalidate refresh token).
   *
   * @param cookies - Cookies containing refreshToken
   * @param options - Request options
   *
   * @example
   * await authRepository.logout(loginResponse.cookies);
   */
  async logout(cookies: string[], options: RequestOptions = {}): Promise<void> {
    const { statusCode = HttpStatus.NO_CONTENT } = options;

    await request(this.httpServer)
      .post(`/${Constants.GLOBAL_PREFIX}/auth/logout`)
      .set('Cookie', cookies)
      .expect(statusCode);
  }

  /**
   * Initiate password recovery (send recovery email).
   *
   * @param email - User email
   * @param options - Request options
   *
   * @example
   * await authRepository.passwordRecovery('user@example.com');
   */
  async passwordRecovery(
    email: string,
    options: RequestOptions = {},
  ): Promise<void> {
    const { statusCode = HttpStatus.NO_CONTENT } = options;

    await request(this.httpServer)
      .post(`/${Constants.GLOBAL_PREFIX}/auth/password-recovery`)
      .send({ email })
      .expect(statusCode);
  }

  /**
   * Set new password with recovery code.
   *
   * @param recoveryCode - Password recovery code
   * @param newPassword - New password
   * @param options - Request options
   *
   * @example
   * await authRepository.newPassword('recoverycode123', 'newpassword123');
   */
  async newPassword(
    recoveryCode: string,
    newPassword: string,
    options: RequestOptions = {},
  ): Promise<void> {
    const { statusCode = HttpStatus.NO_CONTENT } = options;

    await request(this.httpServer)
      .post(`/${Constants.GLOBAL_PREFIX}/auth/new-password`)
      .send({ recoveryCode, newPassword })
      .expect(statusCode);
  }
}
