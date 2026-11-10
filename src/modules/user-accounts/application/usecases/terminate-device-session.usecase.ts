import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SecurityDevicesRepository } from '../../infrastructure/security-devices.repository';
import { SecurityDeviceDocument } from '../../domain/security-device.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class TerminateDeviceSessionCommand {
  constructor(
    public dto: {
      userId: string;
      deviceId: string;
    },
  ) {}
}

@CommandHandler(TerminateDeviceSessionCommand)
export class TerminateDeviceSessionUseCase
  implements ICommandHandler<TerminateDeviceSessionCommand>
{
  constructor(private securityDevicesRepository: SecurityDevicesRepository) {}

  async execute({ dto }: TerminateDeviceSessionCommand): Promise<void> {
    const device: SecurityDeviceDocument | null =
      await this.securityDevicesRepository.findOrNotFoundFail(dto.deviceId);

    if (device.userId !== dto.userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Cannot terminate device session of another user',
      });
    }

    device.makeDeleted();
    await this.securityDevicesRepository.save(device);
  }
}
