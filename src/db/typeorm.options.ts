import * as pg from 'pg';
import { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from './snake-naming.strategy';
import { entities } from './entities';
import { migrations } from './migrations';

export type DbConnectionSettings = {
  databaseUrl?: string;
  dbHost?: string;
  dbPort?: number;
  dbUser?: string;
  dbPassword?: string;
  dbName?: string;
  dbAutoSync?: boolean;
  dbMigrationsRun?: boolean;
};

// shared by the Nest app (TypeOrmModule) and the migrations CLI (data-source.ts).
// entities/migrations are listed explicitly (no globs) so the Vercel bundle can resolve them.
export const buildTypeOrmOptions = (
  settings: DbConnectionSettings,
): DataSourceOptions => ({
  type: 'postgres',
  // TypeORM requires 'pg' dynamically, which Vercel's bundler can't trace; pass it explicitly
  driver: pg,
  ...(settings.databaseUrl
    ? { url: settings.databaseUrl, ssl: { rejectUnauthorized: false } }
    : {
        host: settings.dbHost,
        port: settings.dbPort,
        username: settings.dbUser,
        password: settings.dbPassword,
        database: settings.dbName,
      }),
  entities,
  migrations,
  namingStrategy: new SnakeNamingStrategy(),
  // gen_random_uuid() is built into Postgres 13+, no uuid-ossp extension needed
  uuidExtension: 'pgcrypto',
  synchronize: settings.dbAutoSync ?? false,
  migrationsRun: settings.dbMigrationsRun ?? false,
  // serverless: keep the pool small, Neon pooler does the rest
  extra: { max: 5 },
});
