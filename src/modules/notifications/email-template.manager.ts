import { Injectable } from '@nestjs/common';
import { NotificationsConfig } from './config/notifications.config';

export interface IEmailTemplateManager {
  getConfirmationEmailTemplate(confirmationCode: string): {
    subject: string;
    html: string;
  };
  getPasswordRecoveryEmailTemplate(recoveryCode: string): {
    subject: string;
    html: string;
  };
}

@Injectable()
export class EmailTemplateManager implements IEmailTemplateManager {
  constructor(private notificationsConfig: NotificationsConfig) {}

  getConfirmationEmailTemplate(confirmationCode: string): {
    subject: string;
    html: string;
  } {
    const subject = 'Please confirm your email';
    const confirmationLink = `${this.notificationsConfig.frontendUrl}${this.notificationsConfig.emailConfirmationPath}?code=${confirmationCode}`;

    const html = `
            <h1>Thank you for registration</h1>
            <p>To finish registration please follow the link below:
            <a href="${confirmationLink}">complete registration</a>
            </p>
        `;

    return { subject, html };
  }

  getPasswordRecoveryEmailTemplate(recoveryCode: string): {
    subject: string;
    html: string;
  } {
    const subject = 'Password Recovery';
    const recoveryLink = `${this.notificationsConfig.frontendUrl}${this.notificationsConfig.passwordRecoveryPath}?recoveryCode=${recoveryCode}`;

    const html = `
            <h1>Password Recovery</h1>
            <p>To set a new password please follow the link below:
            <a href="${recoveryLink}">recovery password</a>
            </p>
        `;

    return { subject, html };
  }
}
