import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { SecurityDevice } from './security-device.entity';

export const loginConstraints = {
  minLength: 3,
  maxLength: 10,
  match: /^[a-zA-Z0-9_-]+$/,
};

export const passwordConstraints = {
  minLength: 6,
  maxLength: 20,
};

export const emailConstraints = {
  match: /^[\w\-\.+]+@([\w-]+\.)+[\w-]{2,4}$/,
};

// login/email are unique among non-deleted users only
@Entity('users')
@Index('idx_users_login_unique', ['login'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index('idx_users_email_unique', ['email'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: loginConstraints.maxLength })
  login: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName: string | null;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  emailConfirmationCode: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  emailConfirmationExpirationDate: Date | null;

  @Column({ type: 'boolean', default: false })
  emailIsConfirmed: boolean;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordRecoveryCode: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  passwordRecoveryExpirationDate: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;

  @OneToMany(() => SecurityDevice, (device) => device.user)
  securityDevices: SecurityDevice[];

  static createInstance(dto: CreateUserDomainDto): User {
    const user = new User();
    user.login = dto.login;
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.firstName = dto.firstName ?? null;
    user.lastName = dto.lastName ?? null;
    user.emailConfirmationCode = null;
    user.emailConfirmationExpirationDate = null;
    user.emailIsConfirmed = false;
    user.passwordRecoveryCode = null;
    user.passwordRecoveryExpirationDate = null;
    user.deletedAt = null;
    return user;
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deletedAt = new Date();
  }

  update(dto: UpdateUserDto) {
    if (dto.email !== this.email) {
      this.emailIsConfirmed = false;
      this.email = dto.email;
    }
  }

  setConfirmationCode(code: string, expirationDate: Date) {
    this.emailConfirmationCode = code;
    this.emailConfirmationExpirationDate = expirationDate;
    this.emailIsConfirmed = false;
  }

  confirmEmail() {
    this.emailIsConfirmed = true;
    this.emailConfirmationCode = null;
    this.emailConfirmationExpirationDate = null;
  }

  setPasswordRecoveryCode(code: string, expirationDate: Date) {
    this.passwordRecoveryCode = code;
    this.passwordRecoveryExpirationDate = expirationDate;
  }

  clearPasswordRecoveryCode() {
    this.passwordRecoveryCode = null;
    this.passwordRecoveryExpirationDate = null;
  }

  updatePassword(newPasswordHash: string) {
    this.passwordHash = newPasswordHash;
    this.clearPasswordRecoveryCode();
  }

  isEmailConfirmationExpired(): boolean {
    if (!this.emailConfirmationExpirationDate) return false;
    return new Date() > this.emailConfirmationExpirationDate;
  }

  isPasswordRecoveryExpired(): boolean {
    if (!this.passwordRecoveryExpirationDate) return false;
    return new Date() > this.passwordRecoveryExpirationDate;
  }
}

export type UserDocument = User;
