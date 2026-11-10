import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Pool } from 'pg';

export interface DatabaseConfig {
  connectionString?: string;
  ssl?: { rejectUnauthorized: boolean };
  user?: string;
  host?: string;
  database?: string;
  password?: string;
  port?: number;
}

export const DATABASE_CONFIG = 'DATABASE_CONFIG';

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(@Inject(DATABASE_CONFIG) private dbConfig: DatabaseConfig) {}

  async onModuleInit() {
    this.pool = new Pool(this.dbConfig);

    try {
      const client = await this.pool.connect();
      client.release();
      console.log('Connected to PostgreSQL database');
    } catch (error) {
      console.error('Database connection error', error);
      process.exit(1);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    console.log('Disconnected from PostgreSQL database');
  }

  async query(queryString: string, params?: any[]) {
    return params
      ? this.pool.query(queryString, params)
      : this.pool.query(queryString);
  }
}
