import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SecurityDevicesRepository } from '../../infrastructure/security-devices.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class TerminateAllOtherSessionsCommand {
  constructor(
    public dto: {
      userId: string;
      currentDeviceId: string;
      currentIat: number;
    },
  ) {}
}

@CommandHandler(TerminateAllOtherSessionsCommand)
export class TerminateAllOtherSessionsUseCase
  implements ICommandHandler<TerminateAllOtherSessionsCommand>
{
  constructor(private securityDevicesRepository: SecurityDevicesRepository) {}

  async execute({ dto }: TerminateAllOtherSessionsCommand): Promise<void> {
    const currentDevice = await this.securityDevicesRepository.findByDeviceId(
      dto.currentDeviceId,
    );

    if (!currentDevice || currentDevice.userId !== dto.userId) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid session',
      });
    }

    if (currentDevice.lastActiveDate !== dto.currentIat) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Outdated refresh token',
      });
    }

    await this.securityDevicesRepository.deleteAllUserDevicesExcept(
      dto.userId,
      dto.currentDeviceId,
    );
  }
}
