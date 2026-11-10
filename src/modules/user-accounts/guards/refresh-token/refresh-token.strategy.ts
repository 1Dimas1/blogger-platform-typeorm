import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { RefreshTokenContextDto } from '../dto/refresh-token-context.dto';
import { UserAccountsConfig } from '../../config/user-accounts.config';
import { SecurityDevicesRepository } from '../../infrastructure/security-devices.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh-token',
) {
  constructor(
    userAccountsConfig: UserAccountsConfig,
    private securityDevicesRepository: SecurityDevicesRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request.cookies?.refreshToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: userAccountsConfig.refreshTokenSecret,
      passReqToCallback: false,
    });
  }

  async validate(
    payload: RefreshTokenContextDto,
  ): Promise<RefreshTokenContextDto> {
    if (!payload.id || !payload.deviceId || typeof payload.iat !== 'number') {
      throw new Error('Invalid refresh token payload');
    }

    const session = await this.securityDevicesRepository.findByDeviceId(
      payload.deviceId,
    );

    if (!session || session.userId.toString() !== payload.id) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid or expired device session',
      });
    }

    if (session.lastActiveDate !== payload.iat) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Outdated refresh token',
      });
    }

    if (session.expirationDate < new Date()) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Refresh token expired',
      });
    }

    return {
      id: payload.id,
      deviceId: payload.deviceId,
      iat: payload.iat,
    };
  }
}
