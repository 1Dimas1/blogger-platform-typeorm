import { CreateUserDto } from '../../dto/create-user.dto';
import { CryptoService } from '../services/crypto.service';
import { User, UserDocument } from '../../domain/user.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersFactory {
  constructor(private readonly cryptoService: CryptoService) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const passwordHash: string = await this.cryptoService.createPasswordHash(
      dto.password,
    );

    const user: UserDocument = User.createInstance({
      email: dto.email,
      login: dto.login,
      passwordHash: passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    return user;
  }
}
