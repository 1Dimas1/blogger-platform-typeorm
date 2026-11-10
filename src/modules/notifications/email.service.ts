import { Injectable } from '@nestjs/common';
import { EmailManager } from './email.manager';
import { EmailTemplateManager } from './email-template.manager';

@Injectable()
export class EmailService {
  constructor(
    private emailManager: EmailManager,
    private emailTemplateManager: EmailTemplateManager,
  ) {}

  async sendConfirmationEmail(email: string, code: string): Promise<boolean> {
    const { subject, html } =
      this.emailTemplateManager.getConfirmationEmailTemplate(code);
    return this.emailManager.sendEmail(email, subject, html);
  }

  async sendPasswordRecoveryEmail(
    email: string,
    recoveryCode: string,
  ): Promise<boolean> {
    const { subject, html } =
      this.emailTemplateManager.getPasswordRecoveryEmailTemplate(recoveryCode);
    return this.emailManager.sendEmail(email, subject, html);
  }
}
