import { configModule } from './config-dynamic-module';
import { DynamicModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmOptions } from './db/typeorm.options';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { CoreModule } from './core/core.module';
import { BloggerPlatformModule } from './modules/blogger-platform/blogger-platform.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TestingModule } from './modules/testing/testing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AllHttpExceptionsFilter } from './core/exceptions/filters/all-exceptions.filter';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { DomainHttpExceptionsFilter } from './core/exceptions/filters/domain-exceptions.filter';
import { ThrottlerExceptionFilter } from './core/exceptions/filters/throttler-exception.filter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CoreConfig } from './core/core.config';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'swagger-static'),
      serveRoot: '/api',
    }),
    TypeOrmModule.forRootAsync({
      imports: [CoreModule],
      useFactory: (coreConfig: CoreConfig) => buildTypeOrmOptions(coreConfig),
      inject: [CoreConfig],
    }),
    ThrottlerModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => [
        {
          ttl: coreConfig.rateLimitTtlMs,
          limit: coreConfig.rateLimitMaxRequests,
        },
      ],
      inject: [CoreConfig],
    }),
    UserAccountsModule,
    CoreModule,
    BloggerPlatformModule,
    TestingModule,
    NotificationsModule,
    configModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllHttpExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ThrottlerExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainHttpExceptionsFilter,
    },
  ],
})
export class AppModule {
  static async forRoot(coreConfig: CoreConfig): Promise<DynamicModule> {
    return {
      module: AppModule,
      imports: [...(coreConfig.includeTestingModule ? [TestingModule] : [])], // Add dynamic modules here
    };
  }
}
