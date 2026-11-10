import { config } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm.options';

// DataSource for the TypeORM CLI (migration:generate / run / revert).
// Loads the same env files as the app; real process.env values win.
const nodeEnv = process.env.NODE_ENV ?? 'development';
config({
  path: [
    join(__dirname, `../env/.env.${nodeEnv}.local`),
    join(__dirname, `../env/.env.${nodeEnv}`),
  ],
  quiet: true,
});

export default new DataSource({
  ...buildTypeOrmOptions({
    databaseUrl: process.env.DATABASE_URL || undefined,
    dbHost: process.env.DB_HOST,
    dbPort: Number(process.env.DB_PORT),
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    dbName: process.env.DB_NAME,
  }),
  synchronize: false,
});
