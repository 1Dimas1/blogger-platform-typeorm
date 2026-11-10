import { Inject, Injectable } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';
import { JwtService } from '@nestjs/jwt';
import { UserContextDto } from '../../guards/dto/user-context.dto';
import { CryptoService } from './crypto.service';
import { UserDocument } from '../../domain/user.entity';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../constants/auth-tokens.inject-constants';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';

@Injectable()
export class AuthService {
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,
    private usersRepository: UsersRepository,
    private cryptoService: CryptoService,
  ) {}

  async validateUser(
    loginOrEmail: string,
    password: string,
  ): Promise<UserContextDto | null> {
    // Try to find user by login first, then by email
    let user: UserDocument | null =
      await this.usersRepository.findByLogin(loginOrEmail);

    if (!user) {
      // If not found by login, try email
      user = await this.usersRepository.findByEmail(loginOrEmail);
    }

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Unauthorized',
      });
    }

    const isPasswordValid: boolean = await this.cryptoService.comparePasswords({
      password,
      hash: user.passwordHash,
    });

    if (isPasswordValid) {
      return { id: user.id };
    }

    throw new DomainException({
      code: DomainExceptionCode.Unauthorized,
      message: 'Unauthorized',
    });

    // if (!user.emailConfirmation.isConfirmed) {
    //   throw new DomainException({
    //     code: DomainExceptionCode.EmailNotConfirmed,
    //     message: 'Email is not confirmed',
    //   });
    // }
  }

  async login(userId: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload: UserContextDto = { id: userId };

    const accessToken: string = this.accessTokenContext.sign({
      id: payload.id,
    });

    const refreshToken: string = this.refreshTokenContext.sign({
      id: payload.id,
      deviceId: 'deviceId',
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
