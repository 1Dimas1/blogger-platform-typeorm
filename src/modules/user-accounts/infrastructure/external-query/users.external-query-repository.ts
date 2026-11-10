import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserExternalDto } from './external-dto/users.external-dto';
import { User } from '../../domain/user.entity';

// can be used in other services(blog,post,comment,etc)
@Injectable()
export class UsersExternalQueryRepository {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  async getByIdOrNotFoundFail(id: string): Promise<UserExternalDto> {
    const user = await this.usersRepo.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    return UserExternalDto.mapToView(user);
  }
}
