/**
 * Centralized test configuration constants.
 * These values should match the validation rules and defaults in the application code.
 */
export const TEST_CONSTANTS = {
  /**
   * Admin credentials for BasicAuth
   */
  ADMIN: {
    LOGIN: 'admin',
    PASSWORD: 'qwerty',
  },

  /**
   * Default user credentials for test data
   */
  DEFAULT_USER: {
    PASSWORD: 'password123',
    LOGIN_PREFIX: 'user',
    EMAIL_DOMAIN: 'example.com',
  },

  /**
   * Pagination defaults
   */
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    DEFAULT_PAGE_NUMBER: 1,
    MAX_PAGE_SIZE: 50,
  },

  /**
   * Validation rules for user fields
   */
  VALIDATION: {
    USER: {
      LOGIN_MIN: 3,
      LOGIN_MAX: 10,
      PASSWORD_MIN: 6,
      PASSWORD_MAX: 20,
      EMAIL_PATTERN: /^[^@]+@[^@]+\.[^@]+$/,
    },

    BLOG: {
      NAME_MIN: 1,
      NAME_MAX: 15,
      DESCRIPTION_MIN: 1,
      DESCRIPTION_MAX: 500,
      WEBSITE_URL_MAX: 100,
      WEBSITE_URL_PATTERN: /^https?:\/\/.+/,
    },

    POST: {
      TITLE_MIN: 1,
      TITLE_MAX: 30,
      SHORT_DESCRIPTION_MIN: 1,
      SHORT_DESCRIPTION_MAX: 100,
      CONTENT_MIN: 1,
      CONTENT_MAX: 1000,
    },

    COMMENT: {
      CONTENT_MIN: 20,
      CONTENT_MAX: 300,
    },
  },

  /**
   * Like status enum values
   */
  LIKE_STATUS: {
    NONE: 'None',
    LIKE: 'Like',
    DISLIKE: 'Dislike',
  },

  /**
   * Sort directions
   */
  SORT_DIRECTION: {
    ASC: 'asc',
    DESC: 'desc',
  },

  /**
   * Delays for test operations (in milliseconds)
   */
  DELAYS: {
    /**
     * Delay between bulk creations to ensure distinct timestamps
     */
    BETWEEN_CREATIONS: 10,

    /**
     * Delay for token expiration tests (when using 2s JWT expiration)
     */
    TOKEN_EXPIRATION: 2000,

    /**
     * Short delay for rate limiting tests
     */
    RATE_LIMIT: 100,
  },

  /**
   * HTTP status codes (commonly used in tests)
   */
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TOO_MANY_REQUESTS: 429,
  },

  /**
   * API paths
   */
  PATHS: {
    USERS: 'users',
    AUTH: 'auth',
    SECURITY_DEVICES: 'security/devices',
    BLOGS: 'blogs',
    POSTS: 'posts',
    COMMENTS: 'comments',
    TESTING: 'testing',
  },
};

/**
 * Helper functions for creating test data
 */
export const TEST_HELPERS = {
  /**
   * Creates a string of exact length for validation testing
   */
  createString(length: number): string {
    return 'a'.repeat(length);
  },

  /**
   * Creates a unique login string (max 10 chars)
   */
  createUniqueLogin(prefix: string = 'u'): string {
    // Use shorter timestamp to stay within 10 char limit
    // u + last 8 digits of timestamp = 9 chars
    const shortTimestamp = Date.now().toString().slice(-8);
    return `${prefix}${shortTimestamp}`;
  },

  /**
   * Creates a unique email string
   */
  createUniqueEmail(prefix: string = 'test'): string {
    return `${prefix}${Date.now()}@${TEST_CONSTANTS.DEFAULT_USER.EMAIL_DOMAIN}`;
  },

  /**
   * Creates a valid website URL
   */
  createWebsiteUrl(domain: string = 'example.com'): string {
    return `https://${domain}`;
  },

  /**
   * Creates an invalid email for validation testing
   */
  createInvalidEmail(): string {
    return 'invalid-email-format';
  },

  /**
   * Creates a non-existent UUID for testing 404 responses
   */
  createNonExistentId(): string {
    return '00000000-0000-4000-a000-000000000000';
  },
};
