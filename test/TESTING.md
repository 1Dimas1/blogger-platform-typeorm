# Testing Guidelines

This document provides comprehensive guidance for writing and maintaining e2e tests in the blogger-platform project.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Infrastructure Overview](#test-infrastructure-overview)
3. [Test Helper Patterns](#test-helper-patterns)
4. [Directory Structure](#directory-structure)
5. [Writing Tests Guide](#writing-tests-guide)
6. [Migration Guide](#migration-guide)
7. [Best Practices](#best-practices)
8. [Common Patterns Reference](#common-patterns-reference)

---

## Testing Philosophy

### E2E Testing Approach

Our testing strategy focuses on **end-to-end (e2e) tests** that validate the entire application stack:

- **Real HTTP requests** through the full NestJS application
- **Real database interactions** with MongoDB
- **Real authentication** flows with JWT and cookies
- **Complete request/response cycle** including validation, guards, and serialization

### Test Isolation Principles

1. **Database cleanup before each test** - Every test starts with a clean database
2. **Independent test data** - Each test creates its own test data
3. **No shared state** - Tests do not depend on execution order
4. **Stateless helpers** - Helper classes are reusable and stateless

### Why E2E Over Unit Tests

- **Validates real behavior** - Tests the application as users experience it
- **Catches integration issues** - Verifies that all layers work together
- **Reduces maintenance** - Less mocking, more real behavior
- **Confidence in deployment** - If e2e tests pass, the app works

---

## Test Infrastructure Overview

### Application Initialization with `initSettings()`

The `initSettings()` helper provides **production-like test environment** setup:

```typescript
import { initSettings } from './infrastructure/init-settings';

beforeAll(async () => {
  const result = await initSettings();
  app = result.app;
  httpServer = result.httpServer;
  usersRepository = result.usersRepository;
});
```

**What `initSettings()` does:**

1. **Creates testing module** from production `AppModule`
2. **Overrides EmailService** with `EmailServiceMock` (no real emails sent)
3. **Applies production app setup** (CORS, cookies, validation, global prefix)
4. **Initializes the app** and starts listening
5. **Cleans the database** before returning
6. **Returns test context** with app, repositories, and legacy test managers

### Flexible Provider Overrides

You can customize the test environment by overriding providers:

```typescript
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
```

**Use cases:**
- Custom JWT expiration for token timeout tests
- Mock external services (email, payment gateways, etc.)
- Override configuration for specific test scenarios

### Database Cleanup Strategy

**Two-level cleanup:**

1. **Initial cleanup** in `initSettings()` - Ensures clean start
2. **Per-test cleanup** in `beforeEach()` - Ensures test isolation

```typescript
beforeEach(async () => {
  await deleteAllData(app);
});
```

**Implementation:** Uses dedicated `/api/testing/all-data` endpoint that deletes all MongoDB collections.

**Benefits:**
- No direct database access needed in tests
- Uses same HTTP interface as other operations
- Conditionally enabled via `INCLUDE_TESTING_MODULE` env var

### Mock Service Configuration

**EmailService** is automatically mocked to prevent sending real emails during tests:

```typescript
export class EmailServiceMock extends EmailService {
  async sendConfirmationEmail(email: string, code: string): Promise<boolean> {
    console.log('Call mock method sendConfirmationEmail / EmailServiceMock');
    return true;
  }

  async sendPasswordRecoveryEmail(email: string, code: string): Promise<boolean> {
    console.log('Call mock method sendPasswordRecoveryEmail / EmailServiceMock');
    return true;
  }
}
```

**Verifying email was sent:**

```typescript
it('should call email sending method while registration', async () => {
  const sendEmailMethod = (app.get(EmailService).sendConfirmationEmail = jest
    .fn()
    .mockImplementation(() => Promise.resolve()));

  await authRepository.register({ email: 'test@example.com', ... });

  expect(sendEmailMethod).toHaveBeenCalled();
});
```

---

## Test Helper Patterns

### Repository Pattern

**Purpose:** Encapsulate HTTP request logic for each feature module.

**File:** `test/{feature}/{feature}.repository.ts`

**Example:**

```typescript
export class UsersRepository {
  constructor(private readonly httpServer: any) {}

  async create(
    data: CreateUserInputDto,
    options: RequestOptions = {},
  ): Promise<UserViewDto> {
    const { statusCode = HttpStatus.CREATED, auth = 'admin' } = options;

    const req = request(this.httpServer)
      .post(`/${Constants.GLOBAL_PREFIX}/users`)
      .send(data);

    if (auth === 'admin') {
      req.auth('admin', 'qwerty');
    } else if (auth !== 'none' && typeof auth === 'object') {
      req.auth(auth.token, { type: 'bearer' });
    }

    const response = await req.expect(statusCode);
    return response.body;
  }

  async getAll(
    query: GetUsersQueryParams = {},
    options: RequestOptions = {},
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const { statusCode = HttpStatus.OK, auth = 'admin' } = options;

    let url = `/${Constants.GLOBAL_PREFIX}/users`;
    const queryParams = new URLSearchParams();

    if (query.searchLoginTerm) queryParams.append('searchLoginTerm', query.searchLoginTerm);
    if (query.pageNumber) queryParams.append('pageNumber', query.pageNumber.toString());
    if (query.pageSize) queryParams.append('pageSize', query.pageSize.toString());
    if (query.sortBy) queryParams.append('sortBy', query.sortBy);
    if (query.sortDirection) queryParams.append('sortDirection', query.sortDirection);

    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;

    const req = request(this.httpServer).get(url);

    if (auth === 'admin') {
      req.auth('admin', 'qwerty');
    }

    const response = await req.expect(statusCode);
    return response.body;
  }
}
```

**Key features:**
- **Constructor** takes `httpServer` from `initSettings()`
- **Methods** mirror controller endpoints
- **Options parameter** for flexible authentication and status code expectations
- **Query parameter building** abstracted in `getAll()` methods
- **Type-safe** returns using production ViewDTOs

**RequestOptions interface:**

```typescript
interface RequestOptions {
  statusCode?: number;
  auth?: 'admin' | 'none' | { token: string } | { cookie: string };
  expectError?: boolean;
}
```

### Factory Pattern

**Purpose:** Generate test data with sensible defaults and support partial overrides.

**File:** `test/{feature}/{feature}.factory.ts`

**Example:**

```typescript
export const usersFactory = {
  createUserData(overrides: Partial<CreateUserInputDto> = {}): CreateUserInputDto {
    return {
      login: overrides.login ?? `user${Date.now()}`,
      email: overrides.email ?? `test${Date.now()}@example.com`,
      password: overrides.password ?? 'password123',
      firstName: overrides.firstName,
      lastName: overrides.lastName,
    };
  },

  createInvalidUserData(): CreateUserInputDto {
    return {
      login: 'ab', // Too short (min: 3)
      email: 'invalid-email', // Invalid format
      password: '12345', // Too short (min: 6)
    };
  },

  async createUser(repository: UsersRepository, overrides: Partial<CreateUserInputDto> = {}): Promise<UserViewDto> {
    const userData = this.createUserData(overrides);
    return repository.create(userData);
  },

  async createMultipleUsers(count: number, repository: UsersRepository): Promise<UserViewDto[]> {
    const users: UserViewDto[] = [];
    for (let i = 0; i < count; i++) {
      const user = await this.createUser(repository, {
        login: `user${i}`,
        email: `user${i}@example.com`,
      });
      users.push(user);
      // Add delay to ensure distinct createdAt timestamps for sorting tests
      await delay(10);
    }
    return users;
  },
};
```

**Key features:**
- **Default values** using `??` operator for partial overrides
- **Unique values** using timestamps to avoid conflicts
- **Invalid data generators** for validation testing
- **Bulk creation** utilities with delays for sorting tests
- **Async helpers** that call repositories to create entities

### Custom Assertions Pattern

**Purpose:** Reusable assertion functions for cleaner, more readable tests.

**File:** `test/{feature}/{feature}.expectations.ts`

**Example:**

```typescript
export function expectValidUserShape(user: UserViewDto) {
  expect(typeof user.id).toBe('string');
  expect(typeof user.login).toBe('string');
  expect(typeof user.email).toBe('string');
  expect(typeof user.createdAt).toBe('string');
  expectValidISODateString(user.createdAt);
}

export function expectUserToMatchInput(user: UserViewDto, input: CreateUserInputDto) {
  expect(user.login).toBe(input.login);
  expect(user.email).toBe(input.email);
  // Password should NOT be in response
  expect((user as any).password).toBeUndefined();
}

export function expectUsersToMatch(actual: UserViewDto, expected: UserViewDto) {
  expect(actual.id).toBe(expected.id);
  expect(actual.login).toBe(expected.login);
  expect(actual.email).toBe(expected.email);
  expect(actual.createdAt).toBe(expected.createdAt);
}
```

**Global assertions** (in `test/infrastructure/expect-helpers.ts`):

```typescript
export function expectValidPaginatedResponse<T>(
  response: PaginatedViewDto<T[]>,
  expectedPage: number,
  expectedPageSize: number,
) {
  expect(response).toHaveProperty('items');
  expect(response).toHaveProperty('totalCount');
  expect(response).toHaveProperty('pagesCount');
  expect(response.page).toBe(expectedPage);
  expect(response.pageSize).toBe(expectedPageSize);
  expect(Array.isArray(response.items)).toBe(true);
}

export function expectValidationErrors(response: any, expectedFields: string[]) {
  expect(response.statusCode).toBe(400);
  expect(response.message).toBeDefined();
  expect(Array.isArray(response.message)).toBe(true);

  const errorFields = response.message.map((err: any) => err.field);
  expectedFields.forEach((field) => {
    expect(errorFields).toContain(field);
  });
}

export function expectValidISODateString(dateString: string) {
  expect(typeof dateString).toBe('string');
  expect(new Date(dateString).toISOString()).toBe(dateString);
}
```

### TestContext Setup Pattern

**Purpose:** Create complete authenticated test context with user, tokens, and fixtures.

**File:** `test/infrastructure/test-context.ts`

**Interface:**

```typescript
export interface TestContext {
  user: UserViewDto;
  accessToken: string;
  refreshToken?: string;
  cookies?: string[];
}

export interface TestContextOptions {
  createUser?: boolean;
  autoLogin?: boolean;
  userData?: Partial<CreateUserInputDto>;
}
```

**Usage:**

```typescript
// Create single authenticated user
const context = await createTestContext(app);
console.log(context.user, context.accessToken);

// Create multiple authenticated users
const contexts = await createMultipleTestContexts(app, 3);

// Create user without login
const context = await createTestContext(app, { autoLogin: false });

// Create user with custom data
const context = await createTestContext(app, {
  userData: { login: 'customuser', email: 'custom@example.com' },
});
```

**Benefits:**
- Single function call to set up complex test scenarios
- Reduces test setup boilerplate
- Encapsulates user creation + login flow
- Returns everything needed for authenticated requests

---

## Directory Structure

### Feature-Based Organization

Each feature module has its own test directory with a consistent structure:

```
test/
├── TESTING.md                          # This file
├── jest-e2e.json                       # Jest E2E configuration
├── app.e2e-spec.ts                     # Basic health check tests
│
├── infrastructure/                     # Core test infrastructure
│   ├── init-settings.ts                # App initialization with provider overrides
│   ├── test-context.ts                 # TestContext factory
│   └── expect-helpers.ts               # Global custom assertions
│
├── utils/                              # Utility functions
│   ├── delay.ts                        # Promise-based delay utility
│   ├── delete-all-data.ts              # Database cleanup utility
│   └── cookie-parser.ts                # Cookie extraction utilities
│
├── mocks/                              # Mock implementations
│   └── email-service.mock.ts           # Email service mock
│
├── config/                             # Test configuration
│   └── test-constants.ts               # Centralized test constants
│
├── {feature}/                          # Feature-specific tests
│   ├── {feature}.e2e-spec.ts           # Main test file
│   ├── {feature}.repository.ts         # HTTP request wrappers
│   ├── {feature}.factory.ts            # Test data factories
│   ├── {feature}.expectations.ts       # Custom assertions
│   ├── {feature}.types.ts              # Type definitions
│   └── {feature}.helpers.ts            # Feature-specific helpers
│
├── users/                              # Users feature tests
├── auth/                               # Authentication feature tests
├── security-devices/                   # Security devices feature tests
├── blogs/                              # Blogs feature tests
├── posts/                              # Posts feature tests
├── likes/                              # Likes feature tests
└── comments/                           # Comments feature tests
```

### File Naming Conventions

- **Test files:** `{feature}.e2e-spec.ts`
- **Repositories:** `{feature}.repository.ts`
- **Factories:** `{feature}.factory.ts`
- **Expectations:** `{feature}.expectations.ts`
- **Types:** `{feature}.types.ts`
- **Helpers:** `{feature}.helpers.ts`

### File Responsibilities

#### `{feature}.e2e-spec.ts` - Main Test File

Contains all test cases for the feature module, organized with nested `describe()` blocks:

```typescript
describe('Users', () => {
  describe('GET /users', () => {
    describe('pagination', () => {
      it('should return paginated results', ...)
    });

    describe('filtering', () => {
      it('should filter by searchLoginTerm', ...)
    });
  });

  describe('POST /users', () => {
    describe('validation', () => {
      it('should validate login length', ...)
    });
  });
});
```

#### `{feature}.repository.ts` - HTTP Request Wrappers

Encapsulates HTTP requests using supertest:
- One method per controller endpoint
- Query parameter building
- Authentication handling
- Status code expectations
- Cookie management for auth endpoints

#### `{feature}.factory.ts` - Test Data Factories

Generates test data:
- Valid data with defaults
- Invalid data for validation tests
- Partial override support
- Bulk creation utilities
- Async helpers that call repositories

#### `{feature}.expectations.ts` - Custom Assertions

Feature-specific assertion functions:
- `expectValid{Entity}Shape()` - Validate response structure
- `expect{Entity}ToMatch{Source}()` - Compare entity to input data
- `expect{Entities}ToMatch()` - Compare two entities
- Domain-specific validations

#### `{feature}.types.ts` - Type Definitions

TypeScript interfaces and types:
- Factory parameter types
- Custom assertion types
- Test-specific DTOs
- Type aliases for clarity

#### `{feature}.helpers.ts` - Feature-Specific Helpers

Complex setup scenarios:
- Multi-step operations
- Context creation for specific tests
- Feature-specific utilities

---

## Writing Tests Guide

### Basic Test Structure

```typescript
import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../infrastructure/init-settings';
import { deleteAllData } from '../utils/delete-all-data';
import { UsersRepository } from './users.repository';
import { usersFactory } from './users.factory';
import { expectValidUserShape } from './users.expectations';

describe('Users', () => {
  let app: INestApplication;
  let usersRepository: UsersRepository;

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    usersRepository = result.usersRepository;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  it('should create user with valid data', async () => {
    const userData = usersFactory.createUserData();

    const user = await usersRepository.create(userData);

    expectValidUserShape(user);
    expect(user.login).toBe(userData.login);
    expect(user.email).toBe(userData.email);
  });
});
```

### Authentication Scenarios

#### 1. Admin Operations (BasicAuth)

```typescript
it('should create blog with admin auth', async () => {
  const blogData = blogsFactory.createBlogData();

  const blog = await blogsRepository.create(blogData); // Uses admin auth by default

  expectValidBlogShape(blog);
});

it('should return 401 without admin auth', async () => {
  const blogData = blogsFactory.createBlogData();

  await blogsRepository.create(blogData, {
    statusCode: HttpStatus.UNAUTHORIZED,
    auth: 'none',
  });
});
```

#### 2. User Operations (JWT Bearer)

```typescript
it('should create comment with valid JWT', async () => {
  const context = await createTestContext(app);
  const post = await postsFactory.createPost(postsRepository);
  const commentData = commentsFactory.createCommentData();

  const comment = await commentsRepository.create(post.id, commentData, {
    auth: { token: context.accessToken },
  });

  expect(comment.commentatorInfo.userId).toBe(context.user.id);
});
```

#### 3. Optional Authentication

```typescript
it('should show myStatus as None if not authenticated', async () => {
  const post = await postsFactory.createPost(postsRepository);

  const retrievedPost = await postsRepository.getById(post.id, {
    auth: 'none',
  });

  expect(retrievedPost.extendedLikesInfo.myStatus).toBe('None');
});

it('should show myStatus based on user like if authenticated', async () => {
  const context = await createTestContext(app);
  const post = await postsFactory.createPost(postsRepository);

  await postsRepository.updateLikeStatus(post.id, 'Like', {
    auth: { token: context.accessToken },
  });

  const retrievedPost = await postsRepository.getById(post.id, {
    auth: { token: context.accessToken },
  });

  expect(retrievedPost.extendedLikesInfo.myStatus).toBe('Like');
});
```

#### 4. Cookie-Based Authentication (Refresh Tokens)

```typescript
it('should refresh tokens with valid refresh token cookie', async () => {
  const context = await createTestContext(app);

  const newTokens = await authRepository.refreshToken(context.cookies, {
    statusCode: HttpStatus.OK,
  });

  expect(newTokens.accessToken).toBeDefined();
  expect(newTokens.cookies).toBeDefined();
});
```

### Validation Testing Patterns

#### Boundary Value Testing

```typescript
describe('User validation', () => {
  it('should accept login with 3 characters (minimum)', async () => {
    const userData = usersFactory.createUserData({ login: 'abc' });
    const user = await usersRepository.create(userData);
    expect(user.login).toBe('abc');
  });

  it('should accept login with 10 characters (maximum)', async () => {
    const userData = usersFactory.createUserData({ login: 'a'.repeat(10) });
    const user = await usersRepository.create(userData);
    expect(user.login).toBe('a'.repeat(10));
  });

  it('should reject login with 2 characters (below minimum)', async () => {
    const userData = usersFactory.createUserData({ login: 'ab' });

    await usersRepository.create(userData, {
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it('should reject login with 11 characters (above maximum)', async () => {
    const userData = usersFactory.createUserData({ login: 'a'.repeat(11) });

    await usersRepository.create(userData, {
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });
});
```

#### Multiple Field Validation

```typescript
it('should return validation errors for multiple invalid fields', async () => {
  const userData = {
    login: 'ab', // Too short
    email: 'invalid-email', // Invalid format
    password: '12345', // Too short
  };

  const response = await usersRepository.create(userData, {
    statusCode: HttpStatus.BAD_REQUEST,
  });

  expectValidationErrors(response, ['login', 'email', 'password']);
});
```

### Pagination and Filtering Tests

```typescript
describe('Pagination', () => {
  it('should paginate users correctly', async () => {
    await usersFactory.createMultipleUsers(15, usersRepository);

    // Get page 1
    const page1 = await usersRepository.getAll({
      pageNumber: 1,
      pageSize: 10,
    });

    expectValidPaginatedResponse(page1, 1, 10);
    expect(page1.items).toHaveLength(10);
    expect(page1.totalCount).toBe(15);
    expect(page1.pagesCount).toBe(2);

    // Get page 2
    const page2 = await usersRepository.getAll({
      pageNumber: 2,
      pageSize: 10,
    });

    expect(page2.items).toHaveLength(5);
  });
});

describe('Filtering', () => {
  it('should filter users by searchLoginTerm', async () => {
    await usersRepository.create(usersFactory.createUserData({ login: 'alice123' }));
    await usersRepository.create(usersFactory.createUserData({ login: 'bob456' }));
    await usersRepository.create(usersFactory.createUserData({ login: 'charlie789' }));

    const results = await usersRepository.getAll({
      searchLoginTerm: 'ali',
    });

    expect(results.items).toHaveLength(1);
    expect(results.items[0].login).toBe('alice123');
  });
});

describe('Combined pagination + sorting + filtering', () => {
  it('should handle search with pagination and sorting', async () => {
    await usersFactory.createMultipleUsers(20, usersRepository);

    const results = await usersRepository.getAll({
      searchLoginTerm: 'user',
      pageNumber: 2,
      pageSize: 5,
      sortBy: 'createdAt',
      sortDirection: 'desc',
    });

    expect(results.items.length).toBeLessThanOrEqual(5);
    expect(results.page).toBe(2);

    // Verify descending sort order
    const dates = results.items.map(u => new Date(u.createdAt).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });
});
```

### Nested Resource Testing

```typescript
it('should get posts for specific blog', async () => {
  const blog1 = await blogsFactory.createBlog(blogsRepository);
  const blog2 = await blogsFactory.createBlog(blogsRepository);

  // Create posts for blog1
  await postsFactory.createPost(postsRepository, { blogId: blog1.id });
  await postsFactory.createPost(postsRepository, { blogId: blog1.id });

  // Create post for blog2
  await postsFactory.createPost(postsRepository, { blogId: blog2.id });

  const posts = await blogsRepository.getPosts(blog1.id);

  expect(posts.items).toHaveLength(2);
  expect(posts.items.every(p => p.blogId === blog1.id)).toBe(true);
});
```

### Ownership Verification Tests

```typescript
it('should prevent user from updating other user comment', async () => {
  const userA = await createTestContext(app);
  const userB = await createTestContext(app);

  const post = await postsFactory.createPost(postsRepository);

  // User A creates comment
  const comment = await commentsRepository.create(
    post.id,
    commentsFactory.createCommentData(),
    { auth: { token: userA.accessToken } }
  );

  // User B tries to update it
  await commentsRepository.update(
    comment.id,
    { content: 'Hacked content!' },
    {
      statusCode: HttpStatus.FORBIDDEN,
      auth: { token: userB.accessToken },
    }
  );
});
```

### Like Operations Tests

```typescript
it('should handle Like → Dislike → None → Like sequence', async () => {
  const context = await createTestContext(app);
  const post = await postsFactory.createPost(postsRepository);

  // Like
  await postsRepository.updateLikeStatus(post.id, 'Like', {
    auth: { token: context.accessToken },
  });
  let updatedPost = await postsRepository.getById(post.id, {
    auth: { token: context.accessToken },
  });
  expect(updatedPost.extendedLikesInfo.myStatus).toBe('Like');
  expect(updatedPost.extendedLikesInfo.likesCount).toBe(1);
  expect(updatedPost.extendedLikesInfo.dislikesCount).toBe(0);

  // Dislike
  await postsRepository.updateLikeStatus(post.id, 'Dislike', {
    auth: { token: context.accessToken },
  });
  updatedPost = await postsRepository.getById(post.id, {
    auth: { token: context.accessToken },
  });
  expect(updatedPost.extendedLikesInfo.myStatus).toBe('Dislike');
  expect(updatedPost.extendedLikesInfo.likesCount).toBe(0);
  expect(updatedPost.extendedLikesInfo.dislikesCount).toBe(1);

  // None
  await postsRepository.updateLikeStatus(post.id, 'None', {
    auth: { token: context.accessToken },
  });
  updatedPost = await postsRepository.getById(post.id, {
    auth: { token: context.accessToken },
  });
  expect(updatedPost.extendedLikesInfo.myStatus).toBe('None');
  expect(updatedPost.extendedLikesInfo.likesCount).toBe(0);
  expect(updatedPost.extendedLikesInfo.dislikesCount).toBe(0);

  // Like again
  await postsRepository.updateLikeStatus(post.id, 'Like', {
    auth: { token: context.accessToken },
  });
  updatedPost = await postsRepository.getById(post.id, {
    auth: { token: context.accessToken },
  });
  expect(updatedPost.extendedLikesInfo.myStatus).toBe('Like');
  expect(updatedPost.extendedLikesInfo.likesCount).toBe(1);
});
```

---

## Migration Guide

### From TestManager to Repository Pattern

#### Current Pattern (UsersTestManager)

```typescript
export class UsersTestManager {
  constructor(private app: INestApplication) {}

  async createUser(
    createModel: CreateUserInputDto,
    statusCode: number = HttpStatus.CREATED,
  ): Promise<UserViewDto> {
    const response = await request(this.app.getHttpServer())
      .post(`/${Constants.GLOBAL_PREFIX}/users`)
      .send(createModel)
      .auth('admin', 'qwerty')
      .expect(statusCode);

    return response.body;
  }
}
```

#### New Pattern (UsersRepository)

```typescript
export class UsersRepository {
  constructor(private readonly httpServer: any) {}

  async create(
    data: CreateUserInputDto,
    options: RequestOptions = {},
  ): Promise<UserViewDto> {
    const { statusCode = HttpStatus.CREATED, auth = 'admin' } = options;

    const req = request(this.httpServer)
      .post(`/${Constants.GLOBAL_PREFIX}/users`)
      .send(data);

    if (auth === 'admin') {
      req.auth('admin', 'qwerty');
    } else if (auth !== 'none' && typeof auth === 'object') {
      req.auth(auth.token, { type: 'bearer' });
    }

    const response = await req.expect(statusCode);
    return response.body;
  }
}
```

#### Key Differences

| Aspect | TestManager | Repository |
|--------|-------------|------------|
| **Constructor** | Takes `INestApplication` | Takes `httpServer` |
| **Method names** | `createUser`, `updateUser` | `create`, `update` |
| **Status codes** | Required parameter | Optional in options object |
| **Authentication** | Hardcoded | Flexible via options |
| **Naming** | Verbose | Concise |

#### Backward Compatibility Strategy

Both patterns coexist during migration:

```typescript
// In initSettings()
return {
  app,
  httpServer,
  userTestManger, // Legacy - still works
  usersRepository, // New pattern
};

// In tests - both work:
await userTestManger.createUser(userData); // Old way
await usersRepository.create(userData); // New way
```

#### Migration Steps

1. **Create new repository** alongside existing test manager
2. **Write new tests** using repository pattern
3. **Existing tests** continue using test manager
4. **Gradually migrate** tests to repository pattern (optional)
5. **Eventually deprecate** test manager (optional)

---

## Best Practices

### 1. DRY (Don't Repeat Yourself)

**❌ Bad:**

```typescript
it('test 1', async () => {
  const user = await request(app.getHttpServer())
    .post('/api/users')
    .auth('admin', 'qwerty')
    .send({ login: 'user1', email: 'user1@example.com', password: 'password123' })
    .expect(201);
});

it('test 2', async () => {
  const user = await request(app.getHttpServer())
    .post('/api/users')
    .auth('admin', 'qwerty')
    .send({ login: 'user2', email: 'user2@example.com', password: 'password123' })
    .expect(201);
});
```

**✅ Good:**

```typescript
it('test 1', async () => {
  const user = await usersFactory.createUser(usersRepository, { login: 'user1' });
});

it('test 2', async () => {
  const user = await usersFactory.createUser(usersRepository, { login: 'user2' });
});
```

### 2. Test Isolation

**❌ Bad:** Tests depend on execution order

```typescript
let userId: string; // Shared state

it('should create user', async () => {
  const user = await usersRepository.create(usersFactory.createUserData());
  userId = user.id; // Set shared state
});

it('should delete user', async () => {
  await usersRepository.delete(userId); // Depends on previous test
});
```

**✅ Good:** Tests are independent

```typescript
it('should create user', async () => {
  const user = await usersRepository.create(usersFactory.createUserData());
  expect(user.id).toBeDefined();
});

it('should delete user', async () => {
  const user = await usersFactory.createUser(usersRepository);
  await usersRepository.delete(user.id);
});
```

### 3. Clear Test Names

**❌ Bad:**

```typescript
it('works', ...)
it('test', ...)
it('should do stuff', ...)
```

**✅ Good:**

```typescript
it('should create user with valid data', ...)
it('should return 400 when login is too short', ...)
it('should filter users by searchLoginTerm', ...)
```

### 4. Use Custom Assertions

**❌ Bad:**

```typescript
expect(typeof user.id).toBe('string');
expect(typeof user.login).toBe('string');
expect(typeof user.email).toBe('string');
expect(typeof user.createdAt).toBe('string');
expect(new Date(user.createdAt).toISOString()).toBe(user.createdAt);
```

**✅ Good:**

```typescript
expectValidUserShape(user);
```

### 5. Test One Thing Per Test

**❌ Bad:**

```typescript
it('should handle users', async () => {
  const user = await usersRepository.create(usersFactory.createUserData());
  expect(user.id).toBeDefined();

  const updated = await usersRepository.update(user.id, { login: 'newlogin' });
  expect(updated.login).toBe('newlogin');

  await usersRepository.delete(user.id);
  await usersRepository.getById(user.id, { statusCode: HttpStatus.NOT_FOUND });
});
```

**✅ Good:**

```typescript
it('should create user with valid data', async () => {
  const user = await usersRepository.create(usersFactory.createUserData());
  expect(user.id).toBeDefined();
});

it('should update user login', async () => {
  const user = await usersFactory.createUser(usersRepository);
  const updated = await usersRepository.update(user.id, { login: 'newlogin' });
  expect(updated.login).toBe('newlogin');
});

it('should return 404 when getting deleted user', async () => {
  const user = await usersFactory.createUser(usersRepository);
  await usersRepository.delete(user.id);
  await usersRepository.getById(user.id, { statusCode: HttpStatus.NOT_FOUND });
});
```

### 6. Organize Tests with Nested Describes

**✅ Good:**

```typescript
describe('Users', () => {
  describe('POST /users', () => {
    describe('validation', () => {
      it('should validate login length', ...)
      it('should validate email format', ...)
    });

    describe('authentication', () => {
      it('should require admin auth', ...)
    });
  });

  describe('GET /users', () => {
    describe('pagination', () => {
      it('should paginate results', ...)
    });
  });
});
```

---

## Common Patterns Reference

### Authentication Strategies

#### 1. BasicAuth (Admin Operations)

**Used for:** Blog/post creation, user management

```typescript
const blog = await blogsRepository.create(blogData, {
  auth: 'admin', // Default for admin endpoints
});
```

#### 2. JWT Bearer (User Operations)

**Used for:** Comments, likes, user-specific operations

```typescript
const context = await createTestContext(app);

const comment = await commentsRepository.create(postId, commentData, {
  auth: { token: context.accessToken },
});
```

#### 3. JwtOptional (Public with Optional Auth)

**Used for:** Getting posts/comments with optional like status

```typescript
// Without auth - myStatus: None
const post = await postsRepository.getById(postId, { auth: 'none' });
expect(post.extendedLikesInfo.myStatus).toBe('None');

// With auth - myStatus based on user's like
const context = await createTestContext(app);
const post = await postsRepository.getById(postId, {
  auth: { token: context.accessToken },
});
expect(post.extendedLikesInfo.myStatus).toBe('Like'); // if user liked
```

#### 4. Cookie-Based (Refresh Tokens)

**Used for:** Token refresh, logout, device management

```typescript
const loginResponse = await authRepository.login('user', 'password');
const cookies = loginResponse.cookies;

const newTokens = await authRepository.refreshToken(cookies);
```

### Nested Resources

```typescript
// Create parent
const blog = await blogsFactory.createBlog(blogsRepository);

// Create child via parent endpoint
const post = await blogsRepository.createPost(blog.id, postData);

// Get children via parent endpoint
const posts = await blogsRepository.getPosts(blog.id);
```

### Soft Deletion Testing

```typescript
// Delete (soft delete)
await blogsRepository.delete(blog.id);

// Verify not in listings
const blogs = await blogsRepository.getAll();
expect(blogs.items.find(b => b.id === blog.id)).toBeUndefined();

// Verify 404 when getting by ID
await blogsRepository.getById(blog.id, {
  statusCode: HttpStatus.NOT_FOUND,
});
```

### Time-Sensitive Tests

```typescript
// Override JWT expiration in beforeAll
const result = await initSettings((moduleBuilder) =>
  moduleBuilder
    .overrideProvider(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    .useFactory({
      factory: (config: UserAccountsConfig) => {
        return new JwtService({
          secret: config.accessTokenSecret,
          signOptions: { expiresIn: '2s' },
        });
      },
      inject: [UserAccountsConfig],
    }),
);

// Test token expiration
it('should return 401 with expired token', async () => {
  const context = await createTestContext(app);
  await delay(2000); // Wait for expiration

  await authRepository.me(context.accessToken, {
    statusCode: HttpStatus.UNAUTHORIZED,
  });
});
```

---

## Running Tests

### Run All E2E Tests

```bash
yarn test:e2e
```

### Run Specific Test File

```bash
yarn test:e2e users
```

### Run Tests in Watch Mode

```bash
yarn test:e2e --watch
```

### Run Tests with Coverage

```bash
yarn test:e2e --coverage
```

### WebStorm Run Configurations

Use the pre-configured templates in `.idea/runConfigurations/` or `webstorm/` directory.

---

## Debugging Tests

### Console Logging

Mock services log their calls:

```
Call mock method sendConfirmationEmail / EmailServiceMock
```

### Use Jest's `.only()` and `.skip()`

```typescript
it.only('should create user', ...) // Run only this test
it.skip('should update user', ...) // Skip this test
```

### Use `debugger` Statement

```typescript
it('should create user', async () => {
  const user = await usersRepository.create(usersFactory.createUserData());
  debugger; // Pause here when running in debug mode
  expect(user.id).toBeDefined();
});
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Project CLAUDE.md](/CLAUDE.md) - Main project documentation
