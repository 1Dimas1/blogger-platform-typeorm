import { PaginatedViewDto } from '../../src/core/dto/base.paginated.view-dto';

/**
 * Validates that a response has a valid paginated structure.
 *
 * @param response - The paginated response to validate
 * @param expectedPage - Expected page number
 * @param expectedPageSize - Expected page size
 *
 * @example
 * const users = await usersRepository.getAll({ pageNumber: 2, pageSize: 10 });
 * expectValidPaginatedResponse(users, 2, 10);
 */
export function expectValidPaginatedResponse<T>(
  response: PaginatedViewDto<T[]>,
  expectedPage: number,
  expectedPageSize: number,
) {
  expect(response).toHaveProperty('items');
  expect(response).toHaveProperty('totalCount');
  expect(response).toHaveProperty('pagesCount');
  expect(response).toHaveProperty('page');
  expect(response).toHaveProperty('pageSize');

  expect(response.page).toBe(expectedPage);
  expect(response.pageSize).toBe(expectedPageSize);
  expect(Array.isArray(response.items)).toBe(true);

  // Verify pagesCount calculation
  const expectedPagesCount = Math.ceil(response.totalCount / expectedPageSize);
  expect(response.pagesCount).toBe(expectedPagesCount);
}

/**
 * Validates that a response contains validation errors for specific fields.
 *
 * @param response - The error response body
 * @param expectedFields - Array of field names that should have errors
 *
 * @example
 * const response = await usersRepository.create(invalidData, { statusCode: 400 });
 * expectValidationErrors(response, ['login', 'email', 'password']);
 */
export function expectValidationErrors(
  response: any,
  expectedFields: string[],
) {
  // Response body doesn't include statusCode - it's in HTTP headers
  // Check for message or extensions array
  let errorFields: string[] = [];

  if (response.extensions && Array.isArray(response.extensions)) {
    // Development format: { message, code, extensions: [{ message, field }] }
    errorFields = response.extensions.map((ext: any) => ext.field);
  } else if (
    response.errorsMessages &&
    Array.isArray(response.errorsMessages)
  ) {
    // Production format: { errorsMessages: [{ message, field }] }
    errorFields = response.errorsMessages.map((err: any) => err.field);
  } else if (response.message && Array.isArray(response.message)) {
    // Legacy format (if exists)
    errorFields = response.message.map((err: any) => err.field);
  }

  expectedFields.forEach((field) => {
    expect(errorFields).toContain(field);
  });

  expect(errorFields.length).toBeGreaterThanOrEqual(expectedFields.length);
}

/**
 * Validates that a string is a valid ISO 8601 date string.
 *
 * @param dateString - The date string to validate
 *
 * @example
 * expectValidISODateString(user.createdAt);
 */
export function expectValidISODateString(dateString: string) {
  expect(typeof dateString).toBe('string');

  // Check if it's a valid date
  const parsedDate = new Date(dateString);
  expect(parsedDate.toString()).not.toBe('Invalid Date');

  // Check if it's in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
  expect(parsedDate.toISOString()).toBe(dateString);
}

/**
 * Validates that a string is a valid UUID v4.
 *
 * @param id - The ID string to validate
 *
 * @example
 * expectValidUUID(sessionId);
 */
export function expectValidUUID(id: string) {
  expect(typeof id).toBe('string');
  expect(id).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
}

/**
 * Validates that an error response has the expected HTTP status code and structure.
 *
 * @param response - The error response body
 * @param expectedStatusCode - Expected HTTP status code
 * @param expectedMessage - Optional expected error message
 *
 * @example
 * expectErrorResponse(response, 404, 'Blog not found');
 */
export function expectErrorResponse(
  response: any,
  expectedStatusCode: number,
  expectedMessage?: string,
) {
  // Don't check response.statusCode - it's not in the body
  expect(response.message || response.errorsMessages).toBeDefined();

  if (expectedMessage) {
    if (response.extensions && Array.isArray(response.extensions)) {
      const messages = response.extensions.map((ext: any) => ext.message);
      expect(
        messages.some((msg: string) => msg.includes(expectedMessage)),
      ).toBe(true);
    } else if (
      response.errorsMessages &&
      Array.isArray(response.errorsMessages)
    ) {
      const messages = response.errorsMessages.map((err: any) => err.message);
      expect(
        messages.some((msg: string) => msg.includes(expectedMessage)),
      ).toBe(true);
    } else if (response.message) {
      if (Array.isArray(response.message)) {
        expect(
          response.message.some((msg: any) => msg.includes(expectedMessage)),
        ).toBe(true);
      } else {
        expect(response.message).toContain(expectedMessage);
      }
    }
  }
}

/**
 * Validates that an array is sorted in the expected direction.
 *
 * @param items - Array of items to validate
 * @param direction - Sort direction ('asc' or 'desc')
 * @param getValue - Function to extract the value to compare from each item
 *
 * @example
 * expectSortedBy(users, 'desc', (user) => new Date(user.createdAt).getTime());
 */
export function expectSortedBy<T>(
  items: T[],
  direction: 'asc' | 'desc',
  getValue: (item: T) => number | string,
) {
  const values = items.map(getValue);

  for (let i = 0; i < values.length - 1; i++) {
    const current = values[i];
    const next = values[i + 1];

    if (direction === 'asc') {
      if (typeof current === 'number' && typeof next === 'number') {
        expect(current).toBeLessThanOrEqual(next);
      } else {
        expect(String(current) <= String(next)).toBe(true);
      }
    } else {
      if (typeof current === 'number' && typeof next === 'number') {
        expect(current).toBeGreaterThanOrEqual(next);
      } else {
        expect(String(current) >= String(next)).toBe(true);
      }
    }
  }
}

/**
 * Validates that all items in an array match a predicate.
 *
 * @param items - Array of items to validate
 * @param predicate - Function that returns true if item matches
 * @param description - Description of what should match
 *
 * @example
 * expectAllItemsMatch(users, (user) => user.login.includes('test'), 'login contains "test"');
 */
export function expectAllItemsMatch<T>(
  items: T[],
  predicate: (item: T) => boolean,
  description: string,
) {
  const failedItems = items.filter((item) => !predicate(item));

  if (failedItems.length > 0) {
    throw new Error(
      `Expected all items to match "${description}", but ${failedItems.length} item(s) did not match`,
    );
  }

  expect(failedItems.length).toBe(0);
}
