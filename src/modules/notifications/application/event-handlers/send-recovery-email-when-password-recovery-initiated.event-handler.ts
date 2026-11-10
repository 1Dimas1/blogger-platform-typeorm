import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PasswordRecoveryInitiatedEvent } from '../../../user-accounts/domain/events/password-recovery-initiated.event';
import { EmailService } from '../../email.service';

@EventsHandler(PasswordRecoveryInitiatedEvent)
export class SendRecoveryEmailWhenPasswordRecoveryInitiatedEventHandler
  implements IEventHandler<PasswordRecoveryInitiatedEvent>
{
  constructor(private emailService: EmailService) {}

  async handle(event: PasswordRecoveryInitiatedEvent) {
    try {
      await this.emailService.sendPasswordRecoveryEmail(
        event.email,
        event.recoveryCode,
      );
    } catch (e) {
      console.error('Failed to send password recovery email', e);
    }
  }
}
