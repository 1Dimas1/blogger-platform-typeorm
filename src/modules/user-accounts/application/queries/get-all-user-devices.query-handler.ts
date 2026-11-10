import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SecurityDevicesQueryRepository } from '../../infrastructure/query/security-devices.query-repository';
import { DeviceViewDto } from '../../api/view-dto/device.view-dto';

export class GetAllUserDevicesQuery {
  constructor(public userId: string) {}
}

@QueryHandler(GetAllUserDevicesQuery)
export class GetAllUserDevicesQueryHandler
  implements IQueryHandler<GetAllUserDevicesQuery>
{
  constructor(
    private securityDevicesQueryRepository: SecurityDevicesQueryRepository,
  ) {}

  async execute({ userId }: GetAllUserDevicesQuery): Promise<DeviceViewDto[]> {
    return this.securityDevicesQueryRepository.getAllByUserId(userId);
  }
}
