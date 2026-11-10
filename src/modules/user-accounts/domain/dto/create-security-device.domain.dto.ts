export class CreateSecurityDeviceDomainDto {
  userId: string;
  deviceId: string;
  ip: string;
  title: string;
  expirationDate: Date;
  lastActiveDate?: number;
}
