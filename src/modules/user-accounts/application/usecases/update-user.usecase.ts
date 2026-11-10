import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { UserDocument } from '../../domain/user.entity';

export class UpdateUserCommand {
  constructor(
    public id: string,
    public dto: UpdateUserDto,
  ) {}
}

@CommandHandler(UpdateUserCommand)
export class UpdateUserUseCase
  implements ICommandHandler<UpdateUserCommand, void>
{
  constructor(private usersRepository: UsersRepository) {}

  async execute({ id, dto }: UpdateUserCommand): Promise<void> {
    const user: UserDocument =
      await this.usersRepository.findOrNotFoundFail(id);

    user.update(dto);

    await this.usersRepository.save(user);
  }
}
