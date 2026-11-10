import { Injectable } from '@nestjs/common';
import {
  SecurityDevice,
  SecurityDeviceDocument,
} from '../../domain/security-device.entity';
import { CreateSecurityDeviceDomainDto } from '../../domain/dto/create-security-device.domain.dto';

@Injectable()
export class SecurityDevicesFactory {
  create(dto: CreateSecurityDeviceDomainDto): SecurityDeviceDocument {
    return SecurityDevice.createInstance(dto);
  }
}
