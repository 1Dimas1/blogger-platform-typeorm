import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { configValidationUtility } from '../setup/config-validation.utility';

export enum Environments {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

// each module has its own *.config.ts

@Injectable()
export class CoreConfig {
  @IsNumber(
    {},
    {
      message: 'Set Env variable PORT, example: 3000',
    },
  )
  port: number;

  @IsOptional()
  databaseUrl?: string;

  @ValidateIf((o) => !o.databaseUrl)
  @IsNotEmpty({
    message: 'Set Env variable DB_USER, example: postgres',
  })
  dbUser: string;

  @ValidateIf((o) => !o.databaseUrl)
  @IsNotEmpty({
    message: 'Set Env variable DB_HOST, example: localhost',
  })
  dbHost: string;

  @ValidateIf((o) => !o.databaseUrl)
  @IsNotEmpty({
    message: 'Set Env variable DB_NAME, example: blogger-platform-dev',
  })
  dbName: string;

  @ValidateIf((o) => !o.databaseUrl)
  @IsNotEmpty({
    message: 'Set Env variable DB_PASSWORD',
  })
  dbPassword: string;

  @ValidateIf((o) => !o.databaseUrl)
  @IsNumber(
    {},
    {
      message: 'Set Env variable DB_PORT, example: 5432',
    },
  )
  dbPort: number;

  @IsBoolean({
    message:
      'Set Env variable DB_AUTOSYNC to enable/disable TypeORM schema synchronize (never in production, use migrations), example: false, available values: true, false',
  })
  dbAutoSync: boolean;

  @IsBoolean({
    message:
      'Set Env variable DB_MIGRATIONS_RUN to run pending TypeORM migrations on app start (used on Vercel), example: true, available values: true, false',
  })
  dbMigrationsRun: boolean;

  @IsEnum(Environments, {
    message:
      'Ser correct NODE_ENV value, available values: ' +
      configValidationUtility.getEnumValues(Environments).join(', '),
  })
  env: string;

  @IsBoolean({
    message:
      'Set Env variable IS_SWAGGER_ENABLED to enable/disable Swagger, example: true, available values: true, false',
  })
  isSwaggerEnabled: boolean;

  @IsBoolean({
    message:
      'Set Env variable IS_SWAGGER_STATIC_DOWNLOAD_NEEDED to enable/disable Swagger Static files download, used for Vercel, example: true, available values: true, false',
  })
  isSwaggerStaticDownloadNeeded: boolean;

  @IsBoolean({
    message:
      'Set Env variable INCLUDE_TESTING_MODULE to enable/disable Dangerous for production TestingModule, example: true, available values: true, false, 0, 1',
  })
  includeTestingModule: boolean;

  @IsBoolean({
    message:
      'Set Env variable SEND_INTERNAL_SERVER_ERROR_DETAILS to enable/disable Dangerous for production internal server error details (message, etc), example: true, available values: true, false, 0, 1',
  })
  sendInternalServerErrorDetails: boolean;

  @IsBoolean({
    message:
      'Set Env variable IS_PRODUCTION_DOMAIN_ERROR_RESPONSE_FORMAT to enable/disable for production must be set to true (message, etc), example: true, available values: true, false, 0, 1',
  })
  isProductionDomainErrorResponseFormat: boolean;

  @IsNumber(
    {},
    {
      message:
        'Set Env variable RATE_LIMIT_TTL_MS (milliseconds), example: 10000 (10 seconds)',
    },
  )
  rateLimitTtlMs: number;

  @IsNumber(
    {},
    {
      message:
        'Set Env variable RATE_LIMIT_MAX_REQUESTS, example: 5 (5 requests per time window)',
    },
  )
  rateLimitMaxRequests: number;

  @IsBoolean({
    message:
      'Set Env variable COOKIE_HTTP_ONLY to enable/disable HttpOnly cookie flag, example: true, available values: true, false',
  })
  cookieHttpOnly: boolean;

  @IsBoolean({
    message:
      'Set Env variable COOKIE_SECURE to enable/disable Secure cookie flag (requires HTTPS), example: true, available values: true, false',
  })
  cookieSecure: boolean;

  @IsNotEmpty({
    message:
      'Set Env variable COOKIE_PATH, example: /api/auth (path for authentication cookies)',
  })
  cookiePath: string;

  @IsNumber(
    {},
    {
      message:
        'Set Env variable COOKIE_MAX_AGE_MS (milliseconds), example: 604800000 (7 days)',
    },
  )
  cookieMaxAgeMs: number;

  @IsNotEmpty({
    message:
      'Set Env variable COOKIE_SAME_SITE, example: none, available values: strict, lax, none',
  })
  cookieSameSite: string;

  @IsNotEmpty({
    message:
      'Set Env variable COOKIE_DOMAIN, example: none, available values: strict, lax, none',
  })
  cookieDomain: string;

  constructor(private configService: ConfigService<any, true>) {
    this.port = parseInt(this.configService.get('PORT'));
    this.databaseUrl = this.configService.get('DATABASE_URL') || undefined;
    if (!this.databaseUrl) {
      this.dbUser = this.configService.get('DB_USER');
      this.dbHost = this.configService.get('DB_HOST');
      this.dbName = this.configService.get('DB_NAME');
      this.dbPassword = this.configService.get('DB_PASSWORD');
      this.dbPort = parseInt(this.configService.get('DB_PORT'));
    }
    this.dbAutoSync = configValidationUtility.convertToBoolean(
      this.configService.get('DB_AUTOSYNC'),
    ) as boolean;
    this.dbMigrationsRun = configValidationUtility.convertToBoolean(
      this.configService.get('DB_MIGRATIONS_RUN'),
    ) as boolean;
    this.env = this.configService.get('NODE_ENV');
    this.isSwaggerEnabled = configValidationUtility.convertToBoolean(
      this.configService.get('IS_SWAGGER_ENABLED'),
    ) as boolean;
    this.isSwaggerStaticDownloadNeeded =
      configValidationUtility.convertToBoolean(
        this.configService.get('IS_SWAGGER_STATIC_DOWNLOAD_NEEDED'),
      ) as boolean;
    this.includeTestingModule = configValidationUtility.convertToBoolean(
      this.configService.get('INCLUDE_TESTING_MODULE'),
    ) as boolean;
    this.sendInternalServerErrorDetails =
      configValidationUtility.convertToBoolean(
        this.configService.get('SEND_INTERNAL_SERVER_ERROR_DETAILS'),
      ) as boolean;
    this.isProductionDomainErrorResponseFormat =
      configValidationUtility.convertToBoolean(
        this.configService.get('IS_PRODUCTION_DOMAIN_ERROR_RESPONSE_FORMAT'),
      ) as boolean;
    this.rateLimitTtlMs = parseInt(this.configService.get('RATE_LIMIT_TTL_MS'));
    this.rateLimitMaxRequests = parseInt(
      this.configService.get('RATE_LIMIT_MAX_REQUESTS'),
    );
    this.cookieHttpOnly = configValidationUtility.convertToBoolean(
      this.configService.get('COOKIE_HTTP_ONLY'),
    ) as boolean;
    this.cookieSecure = configValidationUtility.convertToBoolean(
      this.configService.get('COOKIE_SECURE'),
    ) as boolean;
    this.cookiePath = this.configService.get('COOKIE_PATH');
    this.cookieMaxAgeMs = parseInt(this.configService.get('COOKIE_MAX_AGE_MS'));
    this.cookieSameSite = this.configService.get('COOKIE_SAME_SITE');
    this.cookieDomain = this.configService.get('COOKIE_DOMAIN');
    configValidationUtility.validateConfig(this);
  }
}
