import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { UserDocument } from '../../../domain/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { PasswordRecoveryInitiatedEvent } from '../../../domain/events/password-recovery-initiated.event';
import { UserAccountsConfig } from '../../../config/user-accounts.config';
import { calculateExpirationDate } from '../../../utils/calculate-expiration-date.utility';

export class InitiatePasswordRecoveryCommand {
  constructor(public email: string) {}
}

@CommandHandler(InitiatePasswordRecoveryCommand)
export class InitiatePasswordRecoveryUseCase
  implements ICommandHandler<InitiatePasswordRecoveryCommand, void>
{
  constructor(
    private eventBus: EventBus,
    private usersRepository: UsersRepository,
    private userAccountsConfig: UserAccountsConfig,
  ) {}

  async execute({ email }: InitiatePasswordRecoveryCommand): Promise<void> {
    const user: UserDocument | null =
      await this.usersRepository.findByEmail(email);

    if (!user) {
      // Don't reveal that the user doesn't exist
      return;
    }

    const recoveryCode: string = uuidv4();
    const passwordRecoveryTtl: string =
      this.userAccountsConfig.passwordRecoveryCodeExpireIn;
    const expirationDate: Date = calculateExpirationDate(passwordRecoveryTtl);

    user.setPasswordRecoveryCode(recoveryCode, expirationDate);
    await this.usersRepository.save(user);

    this.eventBus.publish(
      new PasswordRecoveryInitiatedEvent(user.email, recoveryCode),
    );
  }
}
