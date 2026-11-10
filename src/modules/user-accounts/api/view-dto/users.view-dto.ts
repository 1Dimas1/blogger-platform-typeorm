import { ApiProperty, OmitType } from '@nestjs/swagger';
import { User } from '../../domain/user.entity';

export class UserViewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  login: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  firstName: string | null;

  @ApiProperty()
  lastName: string | null;

  static mapToView(user: User): UserViewDto {
    const dto = new UserViewDto();

    dto.id = user.id;
    dto.email = user.email;
    dto.login = user.login;
    dto.createdAt = user.createdAt.toISOString();
    // dto.firstName = user.firstName;
    // dto.lastName = user.lastName;

    return dto;
  }
}

export class MeViewDto extends OmitType(UserViewDto, [
  'createdAt',
  'id',
] as const) {
  userId: string;

  static mapToView(user: User): MeViewDto {
    const dto = new MeViewDto();

    dto.email = user.email;
    dto.login = user.login;
    dto.userId = user.id;

    return dto;
  }
}
