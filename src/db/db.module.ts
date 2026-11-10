import { DATABASE_CONFIG, DatabaseConfig, DbService } from './db.service';
import { DynamicModule, Global, Module } from '@nestjs/common';

@Global()
@Module({})
export class DbModule {
  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<DatabaseConfig> | DatabaseConfig;
    inject?: any[];
  }): DynamicModule {
    return {
      module: DbModule,
      imports: options.imports,
      providers: [
        DbService,
        {
          provide: DATABASE_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject,
        },
      ],
      exports: [DbService],
    };
  }
}
