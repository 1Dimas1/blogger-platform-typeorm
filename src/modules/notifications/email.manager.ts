import { Injectable } from '@nestjs/common';
import { EmailAdapter } from './email.adapter';

export interface IEmailManager {
  sendEmail(email: string, subject: string, html: string): Promise<boolean>;
}

@Injectable()
export class EmailManager implements IEmailManager {
  constructor(private readonly emailAdapter: EmailAdapter) {}

  async sendEmail(
    email: string,
    subject: string,
    html: string,
  ): Promise<boolean> {
    return this.emailAdapter.sendEmail(email, subject, html);
  }
}
