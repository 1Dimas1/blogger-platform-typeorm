import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserDto } from '../../../dto/create-user.dto';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { UserRegisteredEvent } from '../../../domain/events/user-registered.event';
import { UsersFactory } from '../../factories/users.factory';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { v4 as uuidv4 } from 'uuid';
import { UserDocument } from '../../../domain/user.entity';
import { calculateExpirationDate } from '../../../utils/calculate-expiration-date.utility';
import { UserAccountsConfig } from '../../../config/user-accounts.config';

export class RegisterUserCommand {
  constructor(public dto: CreateUserDto) {}
}

/**
 * User self-registration via email on registration page
 */
@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase
  implements ICommandHandler<RegisterUserCommand>
{
  constructor(
    private eventBus: EventBus,
    private usersRepository: UsersRepository,
    private usersFactory: UsersFactory,
    private userAccountsConfig: UserAccountsConfig,
  ) {}

  async execute({ dto }: RegisterUserCommand): Promise<void> {
    const userWithTheSameLoginIsExist: boolean =
      await this.usersRepository.loginIsExist(dto.login);

    if (userWithTheSameLoginIsExist) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User with the same login already exists',
        extensions: [
          {
            message: 'User with the same login already exists',
            field: 'login',
          },
        ],
      });
    }

    const userWithTheSameEmailIsExist: boolean =
      await this.usersRepository.emailIsExist(dto.email);

    if (userWithTheSameEmailIsExist) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User with the same email already exists',
        extensions: [
          {
            message: 'User with the same email already exists',
            field: 'email',
          },
        ],
      });
    }

    const user: UserDocument = await this.usersFactory.create(dto);

    const confirmCode: string = uuidv4();
    const emailConfirmationTtl: string =
      this.userAccountsConfig.emailConfirmationCodeExpireIn;
    const expirationDate: Date = calculateExpirationDate(emailConfirmationTtl);

    user.setConfirmationCode(confirmCode, expirationDate);

    await this.usersRepository.save(user);

    this.eventBus.publish(new UserRegisteredEvent(user.email, confirmCode));
  }
}
