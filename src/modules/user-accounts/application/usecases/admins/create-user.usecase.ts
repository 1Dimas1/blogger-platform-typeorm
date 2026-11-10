import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserDto } from '../../../dto/create-user.dto';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { UsersFactory } from '../../factories/users.factory';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class CreateUserCommand {
  constructor(public dto: CreateUserDto) {}
}

/**
 * Admin creates user through admin panel
 */
@CommandHandler(CreateUserCommand)
export class CreateUserUseCase
  implements ICommandHandler<CreateUserCommand, string>
{
  constructor(
    private usersRepository: UsersRepository,
    private usersFactory: UsersFactory,
  ) {}

  async execute({ dto }: CreateUserCommand): Promise<string> {
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

    const user = await this.usersFactory.create(dto);

    user.emailIsConfirmed = true;

    await this.usersRepository.save(user);

    return user.id;
  }
}
