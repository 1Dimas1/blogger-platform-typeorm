import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceViewDto } from '../../api/view-dto/device.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { SecurityDevice } from '../../domain/security-device.entity';

@Injectable()
export class SecurityDevicesQueryRepository {
  constructor(
    @InjectRepository(SecurityDevice)
    private devicesRepo: Repository<SecurityDevice>,
  ) {}

  async getAllByUserId(userId: string): Promise<DeviceViewDto[]> {
    const devices = await this.devicesRepo.find({
      where: { userId },
      order: { lastActiveDate: 'DESC' },
    });

    return devices.map(DeviceViewDto.mapToView);
  }

  async getByDeviceIdOrNotFoundFail(deviceId: string): Promise<DeviceViewDto> {
    const device = await this.devicesRepo.findOneBy({ deviceId });

    if (!device) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Device session not found',
      });
    }

    return DeviceViewDto.mapToView(device);
  }
}
