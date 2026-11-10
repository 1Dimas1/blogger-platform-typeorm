import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty } from 'class-validator';
import { configValidationUtility } from '../../../setup/config-validation.utility';

@Injectable()
export class UserAccountsConfig {
  @IsNotEmpty({
    message: 'Set Env variable ACCESS_TOKEN_EXPIRE_IN, examples: 1h, 5m, 2d',
  })
  accessTokenExpireIn: string;

  @IsNotEmpty({
    message: 'Set Env variable REFRESH_TOKEN_EXPIRE_IN, examples: 1h, 5m, 2d',
  })
  refreshTokenExpireIn: string;

  @IsNotEmpty({
    message: 'Set Env variable REFRESH_TOKEN_SECRET, dangerous for security!',
  })
  refreshTokenSecret: string;

  @IsNotEmpty({
    message: 'Set Env variable ACCESS_TOKEN_SECRET, dangerous for security!',
  })
  accessTokenSecret: string;

  @IsNotEmpty({
    message:
      'Set Env variable EMAIL_CONFIRMATION_CODE_EXPIRE_IN, examples: 1h, 5m, 2d',
  })
  emailConfirmationCodeExpireIn: string;

  @IsNotEmpty({
    message:
      'Set Env variable PASSWORD_RECOVERY_CODE_EXPIRE_IN, examples: 1h, 5m, 2d',
  })
  passwordRecoveryCodeExpireIn: string;

  @IsNotEmpty({
    message: 'Set Env variable ADMIN_LOGIN, dangerous for security!',
  })
  adminLogin: string;

  @IsNotEmpty({
    message: 'Set Env variable ADMIN_PASSWORD, dangerous for security!',
  })
  adminPassword: string;

  constructor(private configService: ConfigService<any, true>) {
    this.accessTokenExpireIn = this.configService.get('ACCESS_TOKEN_EXPIRE_IN');
    this.refreshTokenExpireIn = this.configService.get(
      'REFRESH_TOKEN_EXPIRE_IN',
    );
    this.refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');
    this.accessTokenSecret = this.configService.get('ACCESS_TOKEN_SECRET');
    this.emailConfirmationCodeExpireIn = this.configService.get(
      'EMAIL_CONFIRMATION_CODE_EXPIRE_IN',
    );
    this.passwordRecoveryCodeExpireIn = this.configService.get(
      'PASSWORD_RECOVERY_CODE_EXPIRE_IN',
    );
    this.adminLogin = this.configService.get('ADMIN_LOGIN');
    this.adminPassword = this.configService.get('ADMIN_PASSWORD');

    configValidationUtility.validateConfig(this);
  }
}
