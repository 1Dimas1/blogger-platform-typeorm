import { EmailService } from '../../src/modules/notifications/email.service';

export class EmailServiceMock extends EmailService {
  async sendConfirmationEmail(email: string, code: string): Promise<boolean> {
    console.log('Call mock method sendConfirmationEmail / EmailServiceMock');
    return true;
  }

  async sendPasswordRecoveryEmail(
    email: string,
    code: string,
  ): Promise<boolean> {
    console.log(
      'Call mock method sendPasswordRecoveryEmail / EmailServiceMock',
    );
    return true;
  }
}
