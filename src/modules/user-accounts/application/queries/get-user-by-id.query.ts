import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../infrastructure/query/users.query-repository';

export class GetUserByIdQuery {
  constructor(public userId: string) {}
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdQueryHandler
  implements IQueryHandler<GetUserByIdQuery>
{
  constructor(private usersQueryRepository: UsersQueryRepository) {}

  async execute(query: GetUserByIdQuery) {
    return this.usersQueryRepository.getByIdOrNotFoundFail(query.userId);
  }
}
