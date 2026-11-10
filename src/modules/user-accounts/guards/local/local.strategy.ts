import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { UserContextDto } from '../dto/user-context.dto';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'loginOrEmail', passwordField: 'password' });
  }

  async validate(username: string, password: string): Promise<UserContextDto> {
    // Validate that fields are not empty (return 400 instead of 401 for validation errors)
    if (!username || username.trim() === '') {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'loginOrEmail should not be empty',
        extensions: [
          {
            message: 'loginOrEmail should not be empty',
            field: 'loginOrEmail',
          },
        ],
      });
    }
    if (!password || password.trim() === '') {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'password should not be empty',
        extensions: [
          { message: 'password should not be empty', field: 'password' },
        ],
      });
    }

    const user: UserContextDto | null = await this.authService.validateUser(
      username,
      password,
    );
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid username or password',
      });
    }

    return user;
  }
}
