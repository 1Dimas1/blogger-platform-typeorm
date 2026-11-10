import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserDocument } from '../domain/user.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

// soft-deleted users (deleted_at IS NOT NULL) are excluded by TypeORM automatically (@DeleteDateColumn)
@Injectable()
export class UsersRepository {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.usersRepo.findOneBy({ id });
  }

  async save(user: User): Promise<void> {
    await this.usersRepo.save(user);
  }

  async findOrNotFoundFail(id: string): Promise<UserDocument> {
    const user = await this.findById(id);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
      });
    }
    return user;
  }

  async findByLogin(login: string): Promise<UserDocument | null> {
    return this.usersRepo.findOneBy({ login });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersRepo.findOneBy({ email });
  }

  async findByConfirmationCode(code: string): Promise<UserDocument | null> {
    return this.usersRepo.findOneBy({ emailConfirmationCode: code });
  }

  async findByRecoveryCode(code: string): Promise<UserDocument | null> {
    return this.usersRepo.findOneBy({ passwordRecoveryCode: code });
  }

  async loginIsExist(login: string): Promise<boolean> {
    return this.usersRepo.existsBy({ login });
  }

  async emailIsExist(email: string): Promise<boolean> {
    return this.usersRepo.existsBy({ email });
  }
}
