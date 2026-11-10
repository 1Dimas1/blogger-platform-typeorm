import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { UserViewDto } from '../../api/view-dto/users.view-dto';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { UsersSortBy } from '../../api/input-dto/users-sort-by';
import { User } from '../../domain/user.entity';

const sortByColumnMap: Record<UsersSortBy, string> = {
  [UsersSortBy.CreatedAt]: 'u.createdAt',
  [UsersSortBy.Login]: 'u.login',
  [UsersSortBy.Email]: 'u.email',
};

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  async getByIdOrNotFoundFail(id: string): Promise<UserViewDto> {
    const user = await this.usersRepo.findOneBy({ id });

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'user not found',
      });
    }

    return UserViewDto.mapToView(user);
  }

  async getAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const qb = this.usersRepo.createQueryBuilder('u');

    if (query.searchLoginTerm || query.searchEmailTerm) {
      qb.andWhere(
        new Brackets((or) => {
          if (query.searchLoginTerm) {
            or.orWhere('u.login ILIKE :login', {
              login: `%${query.searchLoginTerm}%`,
            });
          }
          if (query.searchEmailTerm) {
            or.orWhere('u.email ILIKE :email', {
              email: `%${query.searchEmailTerm}%`,
            });
          }
        }),
      );
    }

    const sortColumn = sortByColumnMap[query.sortBy] ?? 'u.createdAt';
    const sortDirection =
      query.sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [users, totalCount] = await qb
      .orderBy(sortColumn, sortDirection)
      .skip(query.calculateSkip())
      .take(query.pageSize)
      .getManyAndCount();

    return PaginatedViewDto.mapToView({
      items: users.map(UserViewDto.mapToView),
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
