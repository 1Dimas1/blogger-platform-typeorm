# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A NestJS-based blogging platform implementing Clean Architecture, Domain-Driven Design (DDD), and CQRS patterns. The application uses MongoDB with Mongoose for data persistence and includes authentication, blogging features, and an event-driven notification system.

## Development Commands

### Installation
```bash
yarn install
```

### Running the Application
```bash
# Development mode with watch
yarn start:dev

# Debug mode
yarn start:debug

# Production mode
yarn start:prod
```

### Testing
```bash
# Run all unit tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:cov

# Run specific test file
yarn test <file-pattern>

# Debug tests
yarn test:debug

# Run e2e tests
yarn test:e2e
```

### Code Quality
```bash
# Build the project
yarn build

# Lint and auto-fix
yarn lint

# Format code
yarn format
```

### Feature Generation
```bash
# Generate new feature scaffold with complete Clean Architecture structure
node templates-generator/generate-feature.js <feature-name>

# Example: node templates-generator/generate-feature.js articles
# Creates: src/modules/articles/ with all layers (api, application, domain, infrastructure)
```

## Architecture Overview

### Layered Architecture Pattern

The codebase implements a strict 4-layer Clean Architecture with CQRS:

```
┌─────────────────────────────────────────────────┐
│  API Layer (api/)                               │
│  - HTTP Controllers                             │
│  - Input DTOs (validation)                      │
│  - View DTOs (response mapping)                 │
│  - Guards & Decorators                          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Application Layer (application/)               │
│  - Command Handlers (write operations)          │
│  - Query Handlers (read operations)             │
│  - Factories (object creation)                  │
│  - Services & External integrations             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Domain Layer (domain/)                         │
│  - Rich domain entities with business logic     │
│  - Domain events                                │
│  - Domain DTOs                                  │
│  - Mongoose schemas                             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Infrastructure Layer (infrastructure/)         │
│  - Write repositories (command side)            │
│  - Query repositories (query side)              │
│  - External data source queries                 │
└─────────────────────────────────────────────────┘
```

### CQRS Implementation

**Commands (Write Operations):**
- Defined in `application/usecases/*.usecase.ts`
- Use `@CommandHandler(CommandName)` decorator
- Execute through `CommandBus`
- Examples: `CreateBlogCommand`, `UpdatePostCommand`

**Queries (Read Operations):**
- Defined in `application/queries/*.query-handler.ts`
- Use `@QueryHandler(QueryName)` decorator
- Execute through `QueryBus`
- Examples: `GetBlogByIdQuery`, `GetBlogsQuery`

**Controller Pattern:**
```typescript
@Post()
async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogViewDto> {
  // 1. Execute command
  const blogId: string = await this.commandBus.execute<CreateBlogCommand, string>(
    new CreateBlogCommand(body)
  );

  // 2. Execute query to return view
  return this.queryBus.execute<GetBlogByIdQuery, BlogViewDto>(
    new GetBlogByIdQuery(blogId)
  );
}
```

### Repository Pattern

**Two repositories per entity:**

1. **Write Repository** (`infrastructure/*.repository.ts`):
   - `findById(id)` - Find entity by ID
   - `save(entity)` - Persist changes
   - `findOrNotFoundFail(id)` - Find or throw DomainException
   - Used by command handlers

2. **Query Repository** (`infrastructure/query/*.query-repository.ts`):
   - `getByIdOrNotFoundFail(id)` - Get view DTO or throw
   - `getAll(queryParams)` - Paginated results with filtering
   - Returns view DTOs directly
   - Used by query handlers

### Domain Entities

Domain entities are Mongoose documents with business logic methods:

```typescript
@Schema({ timestamps: true })
export class Blog {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;  // Soft delete pattern

  // Static factory method
  static createInstance(dto: CreateBlogDomainDto): BlogDocument {
    const blog = new this();
    blog.name = dto.name;
    return blog as BlogDocument;
  }

  // Business logic methods
  makeDeleted() {
    if (this.deletedAt !== null) throw new Error('Entity already deleted');
    this.deletedAt = new Date();
  }

  update(dto: UpdateBlogDto) {
    this.name = dto.name;
  }
}
```

**Key patterns:**
- All entities have `deletedAt` field for soft deletion
- Static `createInstance()` factory methods on entity classes
- Business logic lives in entity methods, not in services
- Query repositories always filter `deletedAt: null`

### Module Structure

Feature modules are located in `src/modules/` and follow this structure:

```
feature-name/
├── api/
│   ├── input-dto/              # Request DTOs with class-validator
│   ├── view-dto/               # Response DTOs with mapToView()
│   └── feature-name.controller.ts
├── application/
│   ├── usecases/               # Command handlers
│   ├── queries/                # Query handlers
│   ├── factories/              # Entity factories
│   └── services/               # Application services
├── domain/
│   ├── feature-name.entity.ts  # Rich domain entity
│   ├── dto/                    # Domain DTOs
│   └── events/                 # Domain events (optional)
├── infrastructure/
│   ├── feature-name.repository.ts      # Write repository
│   └── query/
│       └── feature-name.query-repository.ts  # Read repository
├── dto/                        # Command/query DTOs
├── constants/                  # Feature-specific constants
└── feature-name.module.ts      # Module definition
```

**Main feature modules:**
- `blogger-platform/` - Blogs, posts, comments, likes
- `user-accounts/` - Authentication, user management
- `notifications/` - Event-driven email notifications
- `core/` - Global infrastructure (guards, filters, decorators)

### Authentication & Authorization

**Multiple guard strategies:**

1. **BasicAuthGuard** - Admin operations (blog/post creation)
   - Uses `Authorization: Basic <base64(username:password)>`
   - Credentials from `ADMIN_LOGIN` and `ADMIN_PASSWORD` env vars

2. **JwtAuthGuard** - Requires valid JWT token (strict)
   - Used for authenticated user operations

3. **JwtOptionalAuthGuard** - Optional JWT authentication
   - Returns `null` if token invalid/missing
   - Used when user context is optional (e.g., public posts with optional like status)

**Custom decorators:**
- `@ExtractUserFromRequest()` - Required user (throws if missing)
- `@ExtractUserIfExistsFromRequest()` - Optional user (returns null if missing)

**JWT Configuration:**
- Access token: Short-lived (configured in `ACCESS_TOKEN_EXPIRE_IN`)
- Refresh token: Long-lived (configured in `REFRESH_TOKEN_EXPIRE_IN`)
- Secrets: `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`
- Uses both Passport LocalStrategy and JwtStrategy
- Configuration managed via `UserAccountsConfig` service

### Domain Events & Event Bus

Events enable loose coupling between modules:

**Publishing events:**
```typescript
@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase {
  constructor(private eventBus: EventBus) {}

  async execute({ dto }: RegisterUserCommand): Promise<void> {
    const user = await this.usersFactory.create(dto);
    await this.usersRepository.save(user);

    // Publish domain event
    this.eventBus.publish(new UserRegisteredEvent(user.email, confirmCode));
  }
}
```

**Handling events:**
```typescript
@EventsHandler(UserRegisteredEvent)
export class SendConfirmationEmailWhenUserRegisteredEventHandler
  implements IEventHandler<UserRegisteredEvent> {

  async handle(event: UserRegisteredEvent) {
    await this.emailService.sendConfirmationEmail(
      event.email,
      event.confirmationCode
    );
  }
}
```

**Key principle:** Notifications module is decoupled - it only subscribes to events and has no direct dependencies on domain modules.

### Exception Handling

**Domain exceptions:**
```typescript
throw new DomainException({
  code: DomainExceptionCode.BadRequest,
  message: 'User with the same login already exists',
  extensions: [
    { message: 'User with the same login already exists', field: 'login' }
  ],
});
```

**Exception codes:**
- `NotFound` (1) → HTTP 404
- `BadRequest` (2) → HTTP 400
- `Unauthorized` (11) → HTTP 401
- `EmailNotConfirmed` (12) → HTTP 403
- `ConfirmationCodeExpired` (13) → HTTP 400

Global exception filters (`DomainHttpExceptionsFilter`, `AllHttpExceptionsFilter`) automatically map domain exceptions to appropriate HTTP responses.

### DTOs and Validation

**DTO layering:**
1. **Input DTOs** (`api/input-dto/`) - HTTP request validation with class-validator
2. **Application DTOs** (`dto/`) - Used in commands/queries
3. **Domain DTOs** (`domain/dto/`) - Used in entity methods
4. **View DTOs** (`api/view-dto/`) - HTTP responses

**View DTO pattern:**
```typescript
export class BlogViewDto {
  id: string;
  name: string;
  createdAt: string;

  static mapToView(blog: BlogDocument): BlogViewDto {
    return {
      id: blog.id,
      name: blog.name,
      createdAt: blog.createdAt.toISOString(),
    };
  }
}
```

Always use `mapToView()` static methods to transform entities to DTOs.

### Pagination

**Base query parameters:**
```typescript
export class GetBlogsQueryParams extends BaseQueryParams {
  @IsOptional()
  @IsString()
  searchNameTerm?: string;

  @IsOptional()
  @IsEnum(BlogSortBy)
  sortBy: BlogSortBy = BlogSortBy.CreatedAt;
}
```

**BaseQueryParams includes:**
- `pageNumber` (default: 1)
- `pageSize` (default: 10, max: 50)
- `sortDirection` (default: DESC)
- `calculateSkip()` method

**Paginated response:**
```typescript
export class PaginatedViewDto<T> {
  items: T;
  totalCount: number;
  pagesCount: number;
  page: number;
  pageSize: number;
}
```

Query repositories should return `PaginatedViewDto` for list endpoints.

## Configuration

### Environment Variables

The application uses environment-specific configuration files:
- `.env.production` - Empty template for production deployment (committed to repo)
- `.env.development`, `.env.staging`, `.env.testing` - Example values (committed to repo)
- `.env.development.local`, `.env.testing.local` - Real values for local work (gitignored)

**Required environment variables (35 total):**

```env
# Server Configuration
PORT=3003

# Database Configuration
MONGO_URI='mongodb+srv://...'
DB_NAME='blogger-platform'

# JWT Authentication Secrets
ACCESS_TOKEN_SECRET='your-access-secret-here'
REFRESH_TOKEN_SECRET='your-refresh-secret-here'

# Token Expiration Times (application-level)
ACCESS_TOKEN_EXPIRE_IN='10m'
REFRESH_TOKEN_EXPIRE_IN='7d'
EMAIL_CONFIRMATION_CODE_EXPIRE_IN='24h'
PASSWORD_RECOVERY_CODE_EXPIRE_IN='1h'

# Email Service Configuration
GMAIL_USER='your-email@gmail.com'
GOOGLE_CLIENT_ID='your-client-id.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET='your-client-secret'
GOOGLE_REFRESH_TOKEN='your-refresh-token'

# Admin Credentials
ADMIN_LOGIN='admin'
ADMIN_PASSWORD='secure-password'

# Environment Type
NODE_ENV='development'  # development, staging, production, testing

# API Documentation Settings
IS_SWAGGER_ENABLED=true
IS_SWAGGER_STATIC_DOWNLOAD_NEEDED=false

# Development/Testing Settings
INCLUDE_TESTING_MODULE=true
SEND_INTERNAL_SERVER_ERROR_DETAILS=true
IS_USER_AUTOMATICALLY_CONFIRMED=false
DB_AUTOSYNC=false
IS_PRODUCTION_DOMAIN_ERROR_RESPONSE_FORMAT=false

# Rate Limiting Configuration
RATE_LIMIT_TTL_MS=10000
RATE_LIMIT_MAX_REQUESTS=5

# Cookie Configuration
COOKIE_HTTP_ONLY=true
COOKIE_SECURE=true
COOKIE_PATH=/api/auth
COOKIE_MAX_AGE_MS=604800000

# Email Notification URLs
FRONTEND_URL=https://your-frontend-url.com
EMAIL_CONFIRMATION_PATH=/confirm-email
PASSWORD_RECOVERY_PATH=/password-recovery

# OAuth Token Management
OAUTH_TOKEN_TTL_MS=3600000
OAUTH_REFRESH_BUFFER_MS=300000
GOOGLE_OAUTH_REDIRECT_URL=https://developers.google.com/oauthplayground
```

### Configuration Services

The application uses injectable configuration services to manage environment variables. Each module that requires configuration has its own config service.

**Active configuration services:**

1. **CoreConfig** (`src/core/core.config.ts`) - Core infrastructure settings:
   - Rate limiting: `RATE_LIMIT_TTL_MS`, `RATE_LIMIT_MAX_REQUESTS`
   - Cookie settings: `COOKIE_HTTP_ONLY`, `COOKIE_SECURE`, `COOKIE_PATH`, `COOKIE_MAX_AGE_MS`
   - Feature flags: `INCLUDE_TESTING_MODULE`, `SEND_INTERNAL_SERVER_ERROR_DETAILS`, `IS_PRODUCTION_DOMAIN_ERROR_RESPONSE_FORMAT`, `IS_USER_AUTOMATICALLY_CONFIRMED`
   - General: `PORT`, `NODE_ENV`, `MONGO_URI`, `DB_NAME`, `DB_AUTOSYNC`

2. **UserAccountsConfig** (`src/modules/user-accounts/config/user-accounts.config.ts`) - Authentication settings:
   - JWT secrets: `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`
   - Token expiration: `ACCESS_TOKEN_EXPIRE_IN`, `REFRESH_TOKEN_EXPIRE_IN`
   - Code expiration: `EMAIL_CONFIRMATION_CODE_EXPIRE_IN`, `PASSWORD_RECOVERY_CODE_EXPIRE_IN`
   - Admin credentials: `ADMIN_LOGIN`, `ADMIN_PASSWORD`

3. **NotificationsConfig** (`src/modules/notifications/config/notifications.config.ts`) - Email and notification settings:
   - Frontend URLs: `FRONTEND_URL`, `EMAIL_CONFIRMATION_PATH`, `PASSWORD_RECOVERY_PATH`
   - OAuth settings: `OAUTH_TOKEN_TTL_MS`, `OAUTH_REFRESH_BUFFER_MS`, `GOOGLE_OAUTH_REDIRECT_URL`

**Configuration service pattern:**

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty, IsNumber, IsBoolean } from 'class-validator';
import { configValidationUtility } from 'src/core/config-validation/config-validation.utility';

@Injectable()
export class MyModuleConfig {
  @IsNotEmpty({ message: 'Set Env variable MY_VAR...' })
  myVar: string;

  @IsNumber({}, { message: 'Set Env variable MY_NUMBER...' })
  myNumber: number;

  @IsBoolean({ message: 'Set Env variable MY_FLAG...' })
  myFlag: boolean;

  constructor(private configService: ConfigService<any, true>) {
    // Read environment variables
    this.myVar = this.configService.get('MY_VAR');
    this.myNumber = parseInt(this.configService.get('MY_NUMBER'));
    this.myFlag = this.configService.get('MY_FLAG') === 'true';

    // Validate configuration at startup
    configValidationUtility.validateConfig(this);
  }
}
```

**Key principles:**
- Use `@Injectable()` decorator to make config services available for DI
- Inject `ConfigService` from `@nestjs/config` to read environment variables
- Use class-validator decorators (`@IsNotEmpty`, `@IsNumber`, `@IsBoolean`, `@IsUrl`) for validation
- Call `configValidationUtility.validateConfig(this)` in constructor for runtime validation
- Configuration services must be exported from their module to be used by other modules

**Adding new configuration:**

1. Add environment variable to all `.env` files (production, development, staging, testing)
2. Add property to appropriate config service with validation decorator
3. Read variable in config service constructor using `ConfigService`
4. Register config service in module's `providers` array
5. Export config service if needed by other modules (add to module's `exports` array)
6. Inject config service where needed: `constructor(private config: MyModuleConfig)`

**Module exports for shared configuration:**

Configuration services must be exported from their modules to be used by guards, controllers, or services in other modules:

```typescript
@Module({
  providers: [MyModuleConfig, ...],
  exports: [MyModuleConfig],  // Make config available to other modules
})
export class MyModule {}
```

Example: `UserAccountsConfig` is exported from `UserAccountsModule` so that `BasicAuthGuard` (used in `BloggerPlatformModule`) can inject it to validate admin credentials.

### Application Setup

Application initialization in `src/main.ts`:
- Listens on port from `PORT` env var (default: 3003)
- Global prefix: `/api` (configured in `setup/global-prefix.setup.ts`)
- Swagger UI: `/api` (serves Swagger documentation)
- CORS enabled
- Cookie parser enabled
- Global validation pipe with `transform: true`

## Code Generation Guidelines

When using the feature generator (`node templates-generator/generate-feature.js <name>`):

**Input transformations:**
- `kebabCase` - Converts to kebab-case (e.g., "userAccounts" → "user-accounts")
- `singularize` - Converts plural to singular (e.g., "blogs" → "blog")
- `toCamelCase` - Converts to camelCase
- `toPascalCase` - Converts to PascalCase

**Generated files include:**
- Complete CRUD operations (create, read, update, delete)
- Query parameters with sorting/filtering
- View DTOs with mapping
- Command and query handlers
- Repository implementations (read & write)
- Domain entity with soft delete
- Module with all providers registered

After generation, update:
1. Entity schema with actual properties
2. DTOs with validation rules
3. Query parameters with feature-specific filters
4. Module imports and exports

## Common Patterns

### Creating a New Feature

1. Generate scaffold: `node templates-generator/generate-feature.js feature-name`
2. Define Mongoose schema in `domain/feature-name.entity.ts`
3. Add business logic methods to entity
4. Implement factory in `application/factories/`
5. Add validation to input DTOs
6. Implement repositories (write & query)
7. Implement command handlers (CRUD operations)
8. Implement query handlers (read operations)
9. Wire up controllers
10. Register all handlers in module

### Adding a New Command Handler

1. Create command class in `dto/`
2. Create use case in `application/usecases/`
3. Decorate with `@CommandHandler(CommandClass)`
4. Inject required repositories/factories
5. Register in module's `providers` array

### Adding a New Query Handler

1. Create query class in `dto/`
2. Create handler in `application/queries/`
3. Decorate with `@QueryHandler(QueryClass)`
4. Inject query repository
5. Register in module's `providers` array

### Adding Authentication to Endpoints

```typescript
// Basic auth (admin only)
@UseGuards(BasicAuthGuard)

// JWT required
@UseGuards(JwtAuthGuard)
@ExtractUserFromRequest() user: UserContextDto

// JWT optional
@UseGuards(JwtOptionalAuthGuard)
@ExtractUserIfExistsFromRequest() user: UserContextDto | null
```

### Soft Deletion Pattern

Always implement soft delete:
1. Entity has `deletedAt: Date | null` property
2. Entity has `makeDeleted()` method that sets timestamp
3. Delete use case calls `entity.makeDeleted()` then saves
4. Query repositories filter `deletedAt: null` in all queries
5. Never use hard deletes (Mongoose `.deleteOne()`)

## Testing

### Unit Tests

- Located alongside source files: `*.spec.ts`
- Run with: `yarn test`
- Use NestJS testing utilities: `@nestjs/testing`
- Mock repositories, services, and external dependencies

### E2E Tests

- Located in `test/` directory: `*.e2e-spec.ts`
- Run with: `yarn test:e2e`
- Uses supertest for HTTP assertions
- Testing module provides endpoint to clear database: `DELETE /api/testing/all-data`

## Swagger Documentation

API documentation available at `/api` when running in development mode.

Swagger decorators used:
- `@ApiTags()` - Group endpoints
- `@ApiOperation()` - Describe endpoint
- `@ApiResponse()` - Document responses
- `@ApiProperty()` - Document DTO properties
- `@ApiBearerAuth()` - Mark JWT-protected endpoints

## Key Conventions

1. **Naming:**
   - Controllers: `{feature-name}.controller.ts`
   - Entities: `{singular-feature-name}.entity.ts`
   - Repositories: `{feature-name}.repository.ts`
   - Use cases: `{action}-{singular-feature-name}.usecase.ts`
   - Query handlers: `get-{feature-name}.query-handler.ts`

2. **Module registration:**
   - Import CQRS module: `CqrsModule`
   - Import Mongoose models with `MongooseModule.forFeature()`
   - Register all command/query handlers in `providers`
   - Export repositories if needed by other modules

3. **Imports:**
   - Use absolute imports from `src/` (configured in tsconfig baseUrl)
   - Domain layer should not import from API or Application layers
   - Application layer can import from Domain
   - API layer can import from Application and Domain

4. **Error handling:**
   - Use `DomainException` for business logic errors
   - Use `NotFoundException` from `@nestjs/common` sparingly
   - Repositories have `*OrNotFoundFail()` methods that throw DomainException
   - Never catch exceptions in controllers (filters handle them)

5. **Database queries:**
   - Always filter `deletedAt: null` in queries
   - Use Mongoose query builders, not raw MongoDB queries
   - Implement pagination for list endpoints
   - Use proper indexes (defined in schema decorators)
