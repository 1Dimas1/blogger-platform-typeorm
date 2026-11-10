import { Injectable } from '@nestjs/common';
import { UserDocument } from '../../domain/user.entity';
import { UsersRepository } from '../../infrastructure/users.repository';

@Injectable()
export class UsersExternalService {
  constructor(private usersRepository: UsersRepository) {}

  async makeUserAsSpammer(userId: string): Promise<void> {
    const user: UserDocument =
      await this.usersRepository.findOrNotFoundFail(userId);

    // user.makeSpammer();

    await this.usersRepository.save(user);
  }
}
