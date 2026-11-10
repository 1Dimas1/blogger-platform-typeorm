import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { GmailOAuthManager } from './gmail-oauth.manager';

export interface IEmailAdapter {
  sendEmail(to: string, subject: string, html: string): Promise<boolean>;
}

@Injectable()
export class EmailAdapter implements IEmailAdapter {
  private transporter: nodemailer.Transporter | null = null;
  private gmailUser: string;

  constructor(
    private configService: ConfigService,
    private oAuthManager: GmailOAuthManager,
  ) {
    this.gmailUser = this.configService.get<string>('GMAIL_USER')!;
  }

  private async createTransporter(): Promise<nodemailer.Transporter> {
    try {
      const accessToken = await this.oAuthManager.getValidAccessToken();

      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: this.gmailUser,
          accessToken,
        },
      });
    } catch (error) {
      console.error('Failed to create email transporter:', error);
      throw error;
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      this.transporter = await this.createTransporter();

      if (!this.transporter) {
        throw new Error('Failed to create transporter');
      }

      await this.transporter.sendMail({
        from: `${this.gmailUser}`,
        to,
        subject,
        html,
      });

      this.transporter.close();
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }
}
