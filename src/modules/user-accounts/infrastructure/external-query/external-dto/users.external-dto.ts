import { User } from '../../../domain/user.entity';

export class UserExternalDto {
  id: string;
  login: string;
  email: string;
  createdAt: Date;
  firstName: string | null;
  lastName: string | null;

  static mapToView(user: User): UserExternalDto {
    const dto = new UserExternalDto();

    dto.id = user.id;
    dto.email = user.email;
    dto.login = user.login;
    dto.createdAt = user.createdAt;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;

    return dto;
  }
}
