import { Injectable } from '@nestjs/common';
import { GetBlogsQueryParams } from '../api/input-dto/get-blogs-query-params.input-dto';
import { BlogViewDto } from '../api/view-dto/blogs.view-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DbService } from '../../../../db/db.service';

@Injectable()
export class BlogsQueryRepository {
  constructor(private dbService: DbService) {}

  private getSortColumn(sortBy: string): string {
    const sortColumnMap: Record<string, string> = {
      createdAt: 'created_at',
      name: 'name',
      description: 'description',
      websiteUrl: 'website_url',
    };
    return sortColumnMap[sortBy] || 'created_at';
  }

  async getByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
    const result = await this.dbService.query(
      `SELECT * FROM blogs WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'blog not found',
      });
    }

    return BlogViewDto.mapToView(result.rows[0]);
  }

  async getAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const conditions: string[] = ['deleted_at IS NULL'];
    const params: any[] = [];
    let paramIndex = 1;

    if (query.searchNameTerm) {
      conditions.push(`name ILIKE $${paramIndex}`);
      params.push(`%${query.searchNameTerm}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const sortColumn = this.getSortColumn(query.sortBy);
    const sortDir = query.sortDirection.toUpperCase();

    const countResult = await this.dbService.query(
      `SELECT COUNT(*) FROM blogs WHERE ${whereClause}`,
      params,
    );
    const totalCount = parseInt(countResult.rows[0].count);

    const dataResult = await this.dbService.query(
      `SELECT * FROM blogs WHERE ${whereClause}
       ORDER BY ${sortColumn} ${sortDir}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, query.pageSize, query.calculateSkip()],
    );

    const items: BlogViewDto[] = dataResult.rows.map(BlogViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
