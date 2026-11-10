import { CreateUserInputDto } from '../../src/modules/user-accounts/api/input-dto/create-user.input-dto';
import { TEST_CONSTANTS, TEST_HELPERS } from '../config/test-constants';

/**
 * Factory for creating auth test data.
 * Provides methods for generating valid/invalid registration and login data.
 */
export const authFactory = {
  /**
   * Creates valid registration data with sensible defaults.
   *
   * @param overrides - Partial registration data to override defaults
   * @returns Complete CreateUserInputDto
   *
   * @example
   * const registrationData = authFactory.createRegistrationData();
   */
  createRegistrationData(
    overrides: Partial<CreateUserInputDto> = {},
  ): CreateUserInputDto {
    return {
      login: overrides.login ?? TEST_HELPERS.createUniqueLogin(),
      email: overrides.email ?? TEST_HELPERS.createUniqueEmail(),
      password: overrides.password ?? TEST_CONSTANTS.DEFAULT_USER.PASSWORD,
      firstName: overrides.firstName,
      lastName: overrides.lastName,
    };
  },

  /**
   * Creates login data.
   *
   * @param loginOrEmail - Login or email
   * @param password - Password
   * @returns Login credentials object
   *
   * @example
   * const loginData = authFactory.createLoginData('user', 'password123');
   */
  createLoginData(loginOrEmail: string, password: string) {
    return { loginOrEmail, password };
  },

  /**
   * Creates invalid registration data for validation testing.
   *
   * @returns Invalid CreateUserInputDto
   *
   * @example
   * const invalidData = authFactory.createInvalidRegistrationData();
   */
  createInvalidRegistrationData(): CreateUserInputDto {
    return {
      login: 'ab', // Too short
      email: TEST_HELPERS.createInvalidEmail(),
      password: '12345', // Too short
    };
  },

  /**
   * Creates mock confirmation code.
   *
   * @returns Mock confirmation code
   *
   * @example
   * const code = authFactory.createMockConfirmationCode();
   */
  createMockConfirmationCode(): string {
    return 'mock-confirmation-code-' + Date.now();
  },

  /**
   * Creates mock recovery code.
   *
   * @returns Mock recovery code
   *
   * @example
   * const code = authFactory.createMockRecoveryCode();
   */
  createMockRecoveryCode(): string {
    return 'mock-recovery-code-' + Date.now();
  },
};
