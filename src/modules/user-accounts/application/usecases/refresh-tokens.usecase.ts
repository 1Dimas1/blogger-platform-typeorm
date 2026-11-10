import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../constants/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { SecurityDevicesRepository } from '../../infrastructure/security-devices.repository';
import { SecurityDeviceDocument } from '../../domain/security-device.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { UserAccountsConfig } from '../../config/user-accounts.config';
import { calculateExpirationDate } from '../../utils/calculate-expiration-date.utility';

export class RefreshTokensCommand {
  constructor(
    public dto: {
      userId: string;
      deviceId: string;
      iat: number;
    },
  ) {}
}

// TODO refactor RefreshTokensUseCase
@CommandHandler(RefreshTokensCommand)
export class RefreshTokensUseCase
  implements ICommandHandler<RefreshTokensCommand>
{
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,

    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,

    private securityDevicesRepository: SecurityDevicesRepository,
    private userAccountsConfig: UserAccountsConfig,
  ) {}

  async execute({ dto }: RefreshTokensCommand): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const device: SecurityDeviceDocument | null =
      await this.securityDevicesRepository.findByDeviceId(dto.deviceId);

    if (!device) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid session',
      });
    }

    if (device.userId !== dto.userId) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Device does not belong to user',
      });
    }

    if (device.expirationDate < new Date()) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Refresh token has expired',
      });
    }

    if (dto.iat !== device.lastActiveDate) {
      device.makeDeleted();
      await this.securityDevicesRepository.save(device);

      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Token reuse detected - session terminated',
      });
    }

    const accessToken: string = this.accessTokenContext.sign({
      id: dto.userId,
    });

    // Sign new refresh token - JWT library will auto-generate iat
    const refreshToken: string = this.refreshTokenContext.sign({
      id: dto.userId,
      deviceId: dto.deviceId,
    });

    // Extract the actual iat from the signed token and sync with device
    const decoded = this.refreshTokenContext.decode(refreshToken, {
      json: true,
    });
    if (!decoded || !decoded.iat) {
      throw new Error('Failed to decode refresh token or missing iat claim');
    }

    device.updateLastActiveDate(decoded.iat);

    const newExpirationDate: Date = calculateExpirationDate(
      this.userAccountsConfig.refreshTokenExpireIn,
    );
    device.expirationDate = newExpirationDate;

    await this.securityDevicesRepository.save(device);

    return {
      accessToken,
      refreshToken,
    };
  }
}
