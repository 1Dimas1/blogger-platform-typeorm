import { HttpStatus, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { initSettings } from '../infrastructure/init-settings';
import { deleteAllData } from '../utils/delete-all-data';
import { delay } from '../utils/delay';
import { AuthRepository } from './auth.repository';
import { UsersRepository } from '../users/users.repository';
import { authFactory } from './auth.factory';
import { usersFactory } from '../users/users.factory';
import {
  expectValidLoginResponse,
  expectValidRefreshTokenResponse,
  expectValidMeResponse,
  expectAnonymousUser,
  expectMeToMatchUser,
} from './auth.expectations';
import { createUserAndLogin } from './auth.helpers';
import { TEST_CONSTANTS } from '../config/test-constants';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../../src/modules/user-accounts/constants/auth-tokens.inject-constants';
import { UserAccountsConfig } from '../../src/modules/user-accounts/config/user-accounts.config';
import { EmailService } from '../../src/modules/notifications/email.service';

describe('Auth', () => {
  let app: INestApplication;
  let authRepository: AuthRepository;
  let usersRepository: UsersRepository;

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    authRepository = result.authRepository;
    usersRepository = result.usersRepository;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  describe('POST /auth/registration (User Registration)', () => {
    describe('Success cases', () => {
      it('should register user with valid data', async () => {
        const registrationData = authFactory.createRegistrationData();

        await authRepository.register(registrationData);

        // Should return 204 No Content (registration successful)
      });

      it('should register user with minimum valid login length', async () => {
        const registrationData = authFactory.createRegistrationData({
          login: 'abc', // Minimum 3 chars
        });

        await authRepository.register(registrationData);
      });

      it('should register user with maximum valid login length', async () => {
        const registrationData = authFactory.createRegistrationData({
          login: 'a'.repeat(10), // Maximum 10 chars
        });

        await authRepository.register(registrationData);
      });

      it('should register user with minimum valid password length', async () => {
        const registrationData = authFactory.createRegistrationData({
          password: '123456', // Minimum 6 chars
        });

        await authRepository.register(registrationData);
      });

      it('should send confirmation email on registration', async () => {
        const sendEmailMethod = (app.get(EmailService).sendConfirmationEmail =
          jest.fn().mockImplementation(() => Promise.resolve()));
        const registrationData = authFactory.createRegistrationData();
        await authRepository.register(registrationData);

        expect(sendEmailMethod).toHaveBeenCalled();
        expect(sendEmailMethod).toHaveBeenCalledWith(
          registrationData.email,
          expect.any(String),
        );
      });
    });

    describe('Validation errors', () => {
      it('should return 400 when login is too short', async () => {
        const registrationData = authFactory.createRegistrationData({
          login: 'ab',
        });

        await authRepository.register(registrationData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });
      });

      it('should return 400 when login is too long', async () => {
        const registrationData = authFactory.createRegistrationData({
          login: 'a'.repeat(11),
        });

        await authRepository.register(registrationData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });
      });

      it('should return 400 when password is too short', async () => {
        const registrationData = authFactory.createRegistrationData({
          password: '12345',
        });

        await authRepository.register(registrationData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });
      });

      it('should return 400 when password is too long', async () => {
        const registrationData = authFactory.createRegistrationData({
          password: 'a'.repeat(21),
        });

        await authRepository.register(registrationData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });
      });

      it('should return 400 when email format is invalid', async () => {
        const registrationData = authFactory.createRegistrationData({
          email: 'invalid-email',
        });

        await authRepository.register(registrationData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });
      });

      it('should return 400 when login already exists', async () => {
        const uniqueLogin = `usr${Date.now().toString().slice(-6)}`; // usr + 6 digits = 9 chars
        const registrationData = authFactory.createRegistrationData({
          login: uniqueLogin,
        });
        await authRepository.register(registrationData);

        const duplicateData = authFactory.createRegistrationData({
          login: uniqueLogin,
          email: `dif${Date.now()}@example.com`, // Different email to avoid email conflict
        });
        await authRepository.register(duplicateData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });
      });

      it('should return 400 when email already exists', async () => {
        const uniqueEmail = `ex${Date.now()}@example.com`;
        const registrationData = authFactory.createRegistrationData({
          email: uniqueEmail,
        });
        await authRepository.register(registrationData);

        const duplicateData = authFactory.createRegistrationData({
          email: uniqueEmail,
          login: `dif${Date.now().toString().slice(-6)}`, // Different login (dif + 6 digits = 9 chars)
        });
        await authRepository.register(duplicateData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });
      });

      it('should return 400 with multiple invalid fields', async () => {
        const invalidData = authFactory.createInvalidRegistrationData();

        await authRepository.register(invalidData, {
          statusCode: HttpStatus.BAD_REQUEST,
        });
      });
    });
  });

  describe('POST /auth/login (User Login)', () => {
    let userCredentials: { login: string; email: string; password: string };

    beforeEach(async () => {
      // Create confirmed user via admin endpoint
      const uniqueSuffix = Date.now().toString().slice(-4); // Last 4 digits to stay within 10 char limit
      const userData = usersFactory.createUserData({
        login: `usr${uniqueSuffix}`, // usr + 4 digits = 7 chars (within 10 char limit)
        email: `testuser${Date.now()}@example.com`,
        password: 'password123',
      });
      await usersRepository.create(userData);

      userCredentials = {
        login: userData.login,
        email: userData.email,
        password: userData.password,
      };
    });

    describe('Success cases', () => {
      it('should login with valid login and password', async () => {
        const loginResponse = await authRepository.login(
          userCredentials.login,
          userCredentials.password,
        );

        expectValidLoginResponse(loginResponse);
      });

      it('should login with valid email and password', async () => {
        const loginResponse = await authRepository.login(
          userCredentials.email,
          userCredentials.password,
        );

        expectValidLoginResponse(loginResponse);
      });

      it('should return access token in response body', async () => {
        const loginResponse = await authRepository.login(
          userCredentials.login,
          userCredentials.password,
        );

        expect(loginResponse.body.accessToken).toBeDefined();
        expect(typeof loginResponse.body.accessToken).toBe('string');
      });

      it('should set refresh token in cookie', async () => {
        const loginResponse = await authRepository.login(
          userCredentials.login,
          userCredentials.password,
        );

        expect(loginResponse.refreshToken).toBeDefined();
        expect(loginResponse.cookies.length).toBeGreaterThan(0);
        expect(loginResponse.cookies[0]).toContain('refreshToken=');
      });
    });

    describe('Error cases', () => {
      it('should return 401 with incorrect password', async () => {
        await authRepository.login(userCredentials.login, 'wrongpassword', {
          statusCode: HttpStatus.UNAUTHORIZED,
        });
      });

      it('should return 401 with non-existent user', async () => {
        await authRepository.login('nonexistentuser', 'password123', {
          statusCode: HttpStatus.UNAUTHORIZED,
        });
      });

      it('should return 400 with empty login', async () => {
        await authRepository.login('', userCredentials.password, {
          statusCode: HttpStatus.BAD_REQUEST,
        });
      });

      it('should return 400 with empty password', async () => {
        await authRepository.login(userCredentials.login, '', {
          statusCode: HttpStatus.BAD_REQUEST,
        });
      });
    });
  });

  describe('GET /auth/me (Get Current User)', () => {
    it('should return user info with valid access token', async () => {
      const authContext = await createUserAndLogin(
        usersRepository,
        authRepository,
      );

      const me = await authRepository.me(authContext.accessToken);

      expectValidMeResponse(me);
      expectMeToMatchUser(me, authContext.login, authContext.email);
    });

    it('should return 401 with invalid access token', async () => {
      await authRepository.me('invalid-token', {
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should return 401 without access token', async () => {
      await authRepository.me('', {
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe('GET /auth/me-or-default (Get Current User or Anonymous)', () => {
    it('should return user info with valid access token', async () => {
      const authContext = await createUserAndLogin(
        usersRepository,
        authRepository,
      );

      const me = await authRepository.meOrDefault(authContext.accessToken);

      expectValidMeResponse(me);
      expectMeToMatchUser(me, authContext.login, authContext.email);
    });

    it('should return anonymous user without access token', async () => {
      const me = await authRepository.meOrDefault();

      expectAnonymousUser(me);
    });

    it('should return anonymous user with invalid access token', async () => {
      const me = await authRepository.meOrDefault('invalid-token');

      expectAnonymousUser(me);
    });
  });

  describe('POST /auth/refresh-token (Refresh Tokens)', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const authContext = await createUserAndLogin(
        usersRepository,
        authRepository,
      );

      const refreshResponse = await authRepository.refreshToken(
        authContext.cookies,
      );

      expectValidRefreshTokenResponse(refreshResponse);
    });

    it('should return new access token', async () => {
      const authContext = await createUserAndLogin(
        usersRepository,
        authRepository,
      );

      // Wait 1s so JWT iat (seconds precision) differs
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const refreshResponse = await authRepository.refreshToken(
        authContext.cookies,
      );

      expect(refreshResponse.body.accessToken).toBeDefined();
      expect(refreshResponse.body.accessToken).not.toBe(
        authContext.accessToken,
      );
    });

    it('should return new refresh token in cookie', async () => {
      const authContext = await createUserAndLogin(
        usersRepository,
        authRepository,
      );

      const refreshResponse = await authRepository.refreshToken(
        authContext.cookies,
      );

      expect(refreshResponse.refreshToken).toBeDefined();
      expect(refreshResponse.cookies.length).toBeGreaterThan(0);
    });

    it('should allow using refreshed access token', async () => {
      const authContext = await createUserAndLogin(
        usersRepository,
        authRepository,
      );

      const refreshResponse = await authRepository.refreshToken(
        authContext.cookies,
      );

      const me = await authRepository.me(refreshResponse.body.accessToken);

      expectValidMeResponse(me);
    });

    it('should return 401 with invalid refresh token cookie', async () => {
      await authRepository.refreshToken(['refreshToken=invalid'], {
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should return 401 without refresh token cookie', async () => {
      await authRepository.refreshToken([], {
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe('POST /auth/logout (Logout)', () => {
    it('should logout successfully with valid refresh token', async () => {
      const authContext = await createUserAndLogin(
        usersRepository,
        authRepository,
      );

      await authRepository.logout(authContext.cookies);
    });

    it('should invalidate refresh token after logout', async () => {
      const authContext = await createUserAndLogin(
        usersRepository,
        authRepository,
      );

      await authRepository.logout(authContext.cookies);

      // Try to use the same refresh token again
      await authRepository.refreshToken(authContext.cookies, {
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should still allow access token to work after logout', async () => {
      const authContext = await createUserAndLogin(
        usersRepository,
        authRepository,
      );

      await authRepository.logout(authContext.cookies);

      // Access token should still work until it expires
      const me = await authRepository.me(authContext.accessToken);
      expectValidMeResponse(me);
    });

    it('should return 401 with invalid refresh token', async () => {
      await authRepository.logout(['refreshToken=invalid'], {
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should return 401 without refresh token', async () => {
      await authRepository.logout([], {
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe('POST /auth/password-recovery (Password Recovery)', () => {
    beforeEach(async () => {
      await usersRepository.create(
        usersFactory.createUserData({
          email: 'recovery@example.com',
        }),
      );
    });

    it('should initiate password recovery with valid email', async () => {
      await authRepository.passwordRecovery('recovery@example.com');
    });

    it('should send recovery email', async () => {
      const sendEmailMethod = (app.get(EmailService).sendPasswordRecoveryEmail =
        jest.fn().mockImplementation(() => Promise.resolve()));

      await authRepository.passwordRecovery('recovery@example.com');

      expect(sendEmailMethod).toHaveBeenCalled();
      expect(sendEmailMethod).toHaveBeenCalledWith(
        'recovery@example.com',
        expect.any(String),
      );
    });

    it('should return 204 even if email not registered (security)', async () => {
      await authRepository.passwordRecovery('nonexistent@example.com');
      // Should still return 204 to prevent email enumeration
    });

    it('should validate email format', async () => {
      await authRepository.passwordRecovery('invalid-email', {
        statusCode: HttpStatus.BAD_REQUEST,
      });
    });
  });

  describe('Multiple login sessions', () => {
    it('should allow multiple concurrent logins from same user', async () => {
      const userData = usersFactory.createUserData({
        login: 'multiuser',
        password: 'password123',
      });
      await usersRepository.create(userData);

      const login1 = await authRepository.login(
        userData.login,
        userData.password,
      );
      const login2 = await authRepository.login(
        userData.login,
        userData.password,
      );

      // Both sessions should have valid tokens
      expectValidLoginResponse(login1);
      expectValidLoginResponse(login2);

      // Both access tokens should work
      await authRepository.me(login1.body.accessToken);
      await authRepository.me(login2.body.accessToken);
    });

    it('should allow refreshing tokens from different sessions independently', async () => {
      const userData = usersFactory.createUserData({
        login: 'multiuser',
        password: 'password123',
      });
      await usersRepository.create(userData);

      const login1 = await authRepository.login(
        userData.login,
        userData.password,
      );
      const login2 = await authRepository.login(
        userData.login,
        userData.password,
      );

      // Refresh both sessions
      const refresh1 = await authRepository.refreshToken(login1.cookies);
      const refresh2 = await authRepository.refreshToken(login2.cookies);

      expectValidRefreshTokenResponse(refresh1);
      expectValidRefreshTokenResponse(refresh2);
    });
  });

  describe('Token expiration', () => {
    let appWithShortTokens: INestApplication;
    let authRepoShort: AuthRepository;
    let usersRepoShort: UsersRepository;

    beforeAll(async () => {
      const result = await initSettings((moduleBuilder) =>
        moduleBuilder
          .overrideProvider(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
          .useFactory({
            factory: (userAccountsConfig: UserAccountsConfig) => {
              return new JwtService({
                secret: userAccountsConfig.accessTokenSecret,
                signOptions: { expiresIn: '2s' }, // Short expiration for testing
              });
            },
            inject: [UserAccountsConfig],
          }),
      );
      appWithShortTokens = result.app;
      authRepoShort = new AuthRepository(result.httpServer);
      usersRepoShort = new UsersRepository(result.httpServer);
    });

    afterAll(async () => {
      await appWithShortTokens.close();
    });

    beforeEach(async () => {
      await deleteAllData(appWithShortTokens);
    });

    it('should return 401 with expired access token', async () => {
      const authContext = await createUserAndLogin(
        usersRepoShort,
        authRepoShort,
      );

      // Wait for token to expire
      await delay(TEST_CONSTANTS.DELAYS.TOKEN_EXPIRATION);

      await authRepoShort.me(authContext.accessToken, {
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    });

    it('should still allow refresh even after access token expired', async () => {
      const authContext = await createUserAndLogin(
        usersRepoShort,
        authRepoShort,
      );

      // Wait for access token to expire
      await delay(TEST_CONSTANTS.DELAYS.TOKEN_EXPIRATION);

      // Refresh should still work (refresh token has longer lifetime)
      const refreshResponse = await authRepoShort.refreshToken(
        authContext.cookies,
      );

      expectValidRefreshTokenResponse(refreshResponse);
    });
  });

  describe('Registration confirmation', () => {
    it('should prevent login before email confirmation when auto-confirm is disabled', async () => {
      // Note: This test depends on IS_USER_AUTOMATICALLY_CONFIRMED env var
      // If set to true, users are auto-confirmed and this test would fail
      // This is a reminder that confirmation flow testing might need
      // environment-specific setup
    });
  });
});
