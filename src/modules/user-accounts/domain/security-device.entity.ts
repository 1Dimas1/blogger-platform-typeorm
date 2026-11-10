import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { CreateSecurityDeviceDomainDto } from './dto/create-security-device.domain.dto';

@Entity('security_devices')
@Index('idx_security_devices_device_id_unique', ['deviceId'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class SecurityDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.securityDevices, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  // varchar, not uuid: a malformed id from the URL must give 404, not a cast error
  @Column({ type: 'varchar', length: 255 })
  deviceId: string;

  @Column({ type: 'varchar', length: 45 })
  ip: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  // refresh token iat (seconds)
  @Column({ type: 'integer' })
  lastActiveDate: number;

  @Column({ type: 'timestamptz' })
  expirationDate: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;

  static createInstance(dto: CreateSecurityDeviceDomainDto): SecurityDevice {
    const device = new SecurityDevice();
    device.userId = dto.userId;
    device.deviceId = dto.deviceId;
    device.ip = dto.ip;
    device.title = dto.title;
    device.lastActiveDate = dto.lastActiveDate ?? Math.floor(Date.now() / 1000);
    device.expirationDate = dto.expirationDate;
    device.deletedAt = null;
    return device;
  }

  updateLastActiveDate(iat: number): void {
    this.lastActiveDate = iat;
  }

  makeDeleted(): void {
    if (this.deletedAt !== null) {
      throw new Error('Device session already deleted');
    }
    this.deletedAt = new Date();
  }
}

export type SecurityDeviceDocument = SecurityDevice;
