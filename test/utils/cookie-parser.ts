import { Response } from 'supertest';

/**
 * Extracts the refreshToken value from HTTP response cookies.
 *
 * @param response - Supertest response object
 * @returns The refresh token value, or null if not found
 *
 * @example
 * const loginResponse = await authRepository.login('user', 'password');
 * const refreshToken = extractRefreshToken(loginResponse.response);
 */
export function extractRefreshToken(response: Response): string | null {
  const cookies = response.headers['set-cookie'];
  if (!cookies) return null;

  const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
  const refreshTokenCookie = cookieArray.find((cookie) =>
    cookie.startsWith('refreshToken='),
  );

  if (!refreshTokenCookie) return null;

  const match = refreshTokenCookie.match(/refreshToken=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Extracts all cookies from HTTP response as an array of strings.
 *
 * @param response - Supertest response object
 * @returns Array of cookie strings, or empty array if no cookies
 *
 * @example
 * const loginResponse = await authRepository.login('user', 'password');
 * const cookies = extractCookies(loginResponse.response);
 * // Use in next request:
 * await authRepository.refreshToken(cookies);
 */
export function extractCookies(response: Response): string[] {
  const cookies = response.headers['set-cookie'];
  if (!cookies) return [];

  return Array.isArray(cookies) ? cookies : [cookies];
}

/**
 * Builds a Cookie header string from a cookies object.
 *
 * @param cookies - Object mapping cookie names to values
 * @returns Cookie header string
 *
 * @example
 * const cookieHeader = buildCookieHeader({ refreshToken: 'abc123', sessionId: 'xyz789' });
 * // Result: "refreshToken=abc123; sessionId=xyz789"
 */
export function buildCookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

/**
 * Parses a Set-Cookie header string into an object.
 *
 * @param setCookieHeader - Set-Cookie header string
 * @returns Object with cookie name, value, and attributes
 *
 * @example
 * const cookie = parseCookieHeader('refreshToken=abc123; HttpOnly; Secure; Path=/api/auth');
 * // Result: { name: 'refreshToken', value: 'abc123', httpOnly: true, secure: true, path: '/api/auth' }
 */
export function parseCookieHeader(setCookieHeader: string): {
  name: string;
  value: string;
  httpOnly?: boolean;
  secure?: boolean;
  path?: string;
  maxAge?: number;
  sameSite?: string;
} {
  const parts = setCookieHeader.split(';').map((part) => part.trim());
  const [name, value] = parts[0].split('=');

  const cookie: any = { name, value };

  parts.slice(1).forEach((part) => {
    const [key, val] = part.split('=');
    const lowerKey = key.toLowerCase();

    if (lowerKey === 'httponly') {
      cookie.httpOnly = true;
    } else if (lowerKey === 'secure') {
      cookie.secure = true;
    } else if (lowerKey === 'path') {
      cookie.path = val;
    } else if (lowerKey === 'max-age') {
      cookie.maxAge = parseInt(val, 10);
    } else if (lowerKey === 'samesite') {
      cookie.sameSite = val;
    }
  });

  return cookie;
}

/**
 * Finds a specific cookie by name from response headers.
 *
 * @param response - Supertest response object
 * @param cookieName - Name of the cookie to find
 * @returns Cookie value, or null if not found
 *
 * @example
 * const loginResponse = await authRepository.login('user', 'password');
 * const refreshToken = findCookie(loginResponse.response, 'refreshToken');
 */
export function findCookie(
  response: Response,
  cookieName: string,
): string | null {
  const cookies = response.headers['set-cookie'];
  if (!cookies) return null;

  const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
  const targetCookie = cookieArray.find((cookie) =>
    cookie.startsWith(`${cookieName}=`),
  );

  if (!targetCookie) return null;

  const match = targetCookie.match(new RegExp(`${cookieName}=([^;]+)`));
  return match ? match[1] : null;
}
