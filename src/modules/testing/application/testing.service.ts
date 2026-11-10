import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class TestingService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async deleteAllData() {
    const tableNames = this.dataSource.entityMetadatas
      .map((metadata) => `"${metadata.tableName}"`)
      .join(', ');

    await this.dataSource.query(`TRUNCATE TABLE ${tableNames} CASCADE`);

    return {
      status: 'succeeded',
    };
  }
}
