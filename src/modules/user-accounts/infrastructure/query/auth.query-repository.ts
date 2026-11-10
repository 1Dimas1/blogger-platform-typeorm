import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeViewDto } from '../../api/view-dto/users.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { User } from '../../domain/user.entity';

@Injectable()
export class AuthQueryRepository {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  async me(userId: string): Promise<MeViewDto> {
    const user = await this.usersRepo.findOneBy({ id: userId });

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'User not found',
      });
    }

    return MeViewDto.mapToView(user);
  }
}
