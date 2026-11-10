import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import {
  SecurityDevice,
  SecurityDeviceDocument,
} from '../domain/security-device.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class SecurityDevicesRepository {
  constructor(
    @InjectRepository(SecurityDevice)
    private devicesRepo: Repository<SecurityDevice>,
  ) {}

  async findByDeviceId(
    deviceId: string,
  ): Promise<SecurityDeviceDocument | null> {
    return this.devicesRepo.findOneBy({ deviceId });
  }

  async findOrNotFoundFail(deviceId: string): Promise<SecurityDeviceDocument> {
    const device = await this.findByDeviceId(deviceId);
    if (!device) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Device session not found',
      });
    }
    return device;
  }

  async save(device: SecurityDevice): Promise<void> {
    await this.devicesRepo.save(device);
  }

  async deleteAllUserDevicesExcept(
    userId: string,
    currentDeviceId: string,
  ): Promise<void> {
    await this.devicesRepo.softDelete({
      userId,
      deviceId: Not(currentDeviceId),
    });
  }
}
