import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err instanceof DomainException) {
      throw err;
    }

    // Passport-local calls fail() for missing credentials before validate() is called
    if (!user && info && info.message === 'Missing credentials') {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Missing credentials',
        extensions: [
          {
            message: 'loginOrEmail or password should not be empty',
            field: 'loginOrEmail',
          },
        ],
      });
    }

    return super.handleRequest(err, user, info, context);
  }
}
