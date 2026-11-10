import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SecurityDevicesRepository } from '../../infrastructure/security-devices.repository';
import { SecurityDeviceDocument } from '../../domain/security-device.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class LogoutUserCommand {
  constructor(
    public dto: {
      userId: string;
      deviceId: string;
      iat: number;
    },
  ) {}
}

@CommandHandler(LogoutUserCommand)
export class LogoutUserUseCase implements ICommandHandler<LogoutUserCommand> {
  constructor(private securityDevicesRepository: SecurityDevicesRepository) {}

  async execute({ dto }: LogoutUserCommand): Promise<void> {
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
        message: 'Session does not belong to user',
      });
    }

    if (device.lastActiveDate !== dto.iat) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Refresh token already rotated',
      });
    }

    device.makeDeleted();
    await this.securityDevicesRepository.save(device);
  }
}
