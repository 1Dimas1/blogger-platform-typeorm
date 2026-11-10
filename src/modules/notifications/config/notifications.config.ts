import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty, IsNumber, IsUrl } from 'class-validator';
import { configValidationUtility } from '../../../setup/config-validation.utility';

@Injectable()
export class NotificationsConfig {
  @IsUrl(
    {},
    {
      message:
        'Set Env variable FRONTEND_URL, example: https://myapp.com or http://localhost:3000',
    },
  )
  frontendUrl: string;

  @IsNotEmpty({
    message:
      'Set Env variable EMAIL_CONFIRMATION_PATH, example: /confirm-email',
  })
  emailConfirmationPath: string;

  @IsNotEmpty({
    message:
      'Set Env variable PASSWORD_RECOVERY_PATH, example: /password-recovery',
  })
  passwordRecoveryPath: string;

  @IsNumber(
    {},
    {
      message:
        'Set Env variable OAUTH_TOKEN_TTL_MS (milliseconds), example: 3600000 (1 hour)',
    },
  )
  oauthTokenTtlMs: number;

  @IsNumber(
    {},
    {
      message:
        'Set Env variable OAUTH_REFRESH_BUFFER_MS (milliseconds), example: 300000 (5 minutes)',
    },
  )
  oauthRefreshBufferMs: number;

  @IsUrl(
    {},
    {
      message:
        'Set Env variable GOOGLE_OAUTH_REDIRECT_URL, example: https://developers.google.com/oauthplayground',
    },
  )
  googleOAuthRedirectUrl: string;

  constructor(private configService: ConfigService<any, true>) {
    this.frontendUrl = this.configService.get('FRONTEND_URL');
    this.emailConfirmationPath = this.configService.get(
      'EMAIL_CONFIRMATION_PATH',
    );
    this.passwordRecoveryPath = this.configService.get(
      'PASSWORD_RECOVERY_PATH',
    );
    this.oauthTokenTtlMs = parseInt(
      this.configService.get('OAUTH_TOKEN_TTL_MS'),
    );
    this.oauthRefreshBufferMs = parseInt(
      this.configService.get('OAUTH_REFRESH_BUFFER_MS'),
    );
    this.googleOAuthRedirectUrl = this.configService.get(
      'GOOGLE_OAUTH_REDIRECT_URL',
    );

    configValidationUtility.validateConfig(this);
  }
}
