/**
 * Type definitions for auth testing
 */

/**
 * Represents complete auth context with user and tokens
 */
export interface AuthContext {
  login: string;
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string | null;
  cookies: string[];
  userId?: string;
}

/**
 * Registration credentials
 */
export interface RegistrationCredentials {
  login: string;
  email: string;
  password: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  loginOrEmail: string;
  password: string;
}
