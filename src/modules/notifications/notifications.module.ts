import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsConfig } from './config/notifications.config';
import { EmailService } from './email.service';
import { EmailManager } from './email.manager';
import { EmailAdapter } from './email.adapter';
import { EmailTemplateManager } from './email-template.manager';
import { GmailOAuthManager } from './gmail-oauth.manager';
import { GmailOAuthAdapter } from './gmail-oauth.adapter';
import { SendConfirmationEmailWhenUserRegisteredEventHandler } from './application/event-handlers/send-confirmation-email-when-user-registered.event-handler';
import { SendConfirmationEmailWhenResendRequestedEventHandler } from './application/event-handlers/send-confirmation-email-when-resend-requested.event-handler';
import { SendRecoveryEmailWhenPasswordRecoveryInitiatedEventHandler } from './application/event-handlers/send-recovery-email-when-password-recovery-initiated.event-handler';

const eventHandlers = [
  SendConfirmationEmailWhenUserRegisteredEventHandler,
  SendConfirmationEmailWhenResendRequestedEventHandler,
  SendRecoveryEmailWhenPasswordRecoveryInitiatedEventHandler,
];

@Module({
  imports: [ConfigModule],
  providers: [
    NotificationsConfig,
    ...eventHandlers,
    EmailService,
    EmailManager,
    EmailAdapter,
    EmailTemplateManager,
    GmailOAuthManager,
    GmailOAuthAdapter,
  ],
  exports: [],
})
export class NotificationsModule {}
