import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ConfirmationEmailResendRequestedEvent } from '../../../user-accounts/domain/events/confirmation-email-resend-requested.event';
import { EmailService } from '../../email.service';

@EventsHandler(ConfirmationEmailResendRequestedEvent)
export class SendConfirmationEmailWhenResendRequestedEventHandler
  implements IEventHandler<ConfirmationEmailResendRequestedEvent>
{
  constructor(private emailService: EmailService) {}

  async handle(event: ConfirmationEmailResendRequestedEvent) {
    try {
      await this.emailService.sendConfirmationEmail(
        event.email,
        event.confirmationCode,
      );
    } catch (e) {
      console.error('Failed to send confirmation email on resend request', e);
    }
  }
}
