export class CreateUserDto {
  login: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}
