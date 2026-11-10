export class CreateUserDomainDto {
  login: string;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
}
