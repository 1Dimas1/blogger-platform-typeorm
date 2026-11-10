import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { GetBlogsQueryParams } from '../api/input-dto/get-blogs-query-params.input-dto';
import { BlogViewDto } from '../api/view-dto/blogs.view-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Blog } from '../domain/blog.entity';

const sortableFields: (keyof Blog)[] = [
  'createdAt',
  'name',
  'description',
  'websiteUrl',
];

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectRepository(Blog) private blogsRepo: Repository<Blog>) {}

  async getByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
    const blog = await this.blogsRepo.findOneBy({ id });

    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'blog not found',
      });
    }

    return BlogViewDto.mapToView(blog);
  }

  async getAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const where: FindOptionsWhere<Blog> = query.searchNameTerm
      ? { name: ILike(`%${query.searchNameTerm}%`) }
      : {};
    const sortBy = sortableFields.includes(query.sortBy as keyof Blog)
      ? query.sortBy
      : 'createdAt';

    const [blogs, totalCount] = await this.blogsRepo.findAndCount({
      where,
      order: { [sortBy]: query.sortDirection.toUpperCase() },
      skip: query.calculateSkip(),
      take: query.pageSize,
    });

    return PaginatedViewDto.mapToView({
      items: blogs.map(BlogViewDto.mapToView),
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
