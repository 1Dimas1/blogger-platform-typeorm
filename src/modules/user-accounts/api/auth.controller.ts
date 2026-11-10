import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Res,
  Ip,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { MeViewDto } from './view-dto/users.view-dto';
import { CreateUserInputDto } from './input-dto/create-user.input-dto';
import { LoginInputDto } from './input-dto/login.input-dto';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { ExtractUserFromRequest } from '../guards/decorators/param/extract-user-from-request.decorator';
import { Nullable, UserContextDto } from '../guards/dto/user-context.dto';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { JwtOptionalAuthGuard } from '../guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { AuthQueryRepository } from '../infrastructure/query/auth.query-repository';
import { RegistrationConfirmationInputDto } from './input-dto/registration-confirmation.input-dto';
import { RegistrationEmailResendingInputDto } from './input-dto/registration-email-resending.input-dto';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';
import { NewPasswordInputDto } from './input-dto/new-password.input-dto';
import { Constants } from '../../../core/constants';
import { CommandBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../application/usecases/users/register-user.usecase';
import { ConfirmRegistrationCommand } from '../application/usecases/users/confirm-registration.usecase';
import { ResendConfirmationEmailCommand } from '../application/usecases/users/resend-confirmation-email.usecase';
import { InitiatePasswordRecoveryCommand } from '../application/usecases/users/initiate-password-recovery.usecase';
import { ConfirmPasswordRecoveryCommand } from '../application/usecases/users/confirm-password-recovery.usecase';
import { LoginUserCommand } from '../application/usecases/login-user.usecase';
import { RefreshTokenAuthGuard } from '../guards/refresh-token/refresh-token-auth.guard';
import { ExtractRefreshTokenFromRequest } from '../guards/decorators/param/extract-refresh-token-from-request.decorator';
import { RefreshTokenContextDto } from '../guards/dto/refresh-token-context.dto';
import { RefreshTokensCommand } from '../application/usecases/refresh-tokens.usecase';
import { LogoutUserCommand } from '../application/usecases/logout-user.usecase';
import { ParsedUserAgent } from '../guards/decorators/param/parsed-user-agent.decorator';
import { CoreConfig } from '../../../core/core.config';

@ApiTags('Auth')
@Controller(Constants.PATH.AUTH)
export class AuthController {
  constructor(
    private commandBus: CommandBus,
    private authQueryRepository: AuthQueryRepository,
    private coreConfig: CoreConfig,
  ) {}

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Registration in the system. Email with confirmation code will be send to passed email address',
  })
  @ApiResponse({
    status: 204,
    description:
      'Input data is accepted. Email with confirmation code will be send to passed email address',
  })
  @ApiResponse({
    status: 400,
    description:
      'If the inputModel has incorrect values (in particular if the user with the given email or login already exists)',
  })
  @ApiResponse({
    status: 429,
    description: 'More than 5 attempts from one IP-address during 10 seconds',
  })
  registration(@Body() body: CreateUserInputDto): Promise<void> {
    return this.commandBus.execute(new RegisterUserCommand(body));
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Confirm registration' })
  @ApiResponse({
    status: 204,
    description: 'Email was verified. Account was activated',
  })
  @ApiResponse({
    status: 400,
    description:
      'If the confirmation code is incorrect, expired or already been applied',
  })
  @ApiResponse({
    status: 429,
    description: 'More than 5 attempts from one IP-address during 10 seconds',
  })
  registrationConfirmation(
    @Body() body: RegistrationConfirmationInputDto,
  ): Promise<void> {
    return this.commandBus.execute(new ConfirmRegistrationCommand(body.code));
  }

  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Resend confirmation registration Email if user exists',
  })
  @ApiResponse({
    status: 204,
    description:
      'Input data is accepted.Email with confirmation code will be send to passed email address.Confirmation code should be inside link as query param, for example: https://some-front.com/confirm-registration?code=youtcodehere',
  })
  @ApiResponse({
    status: 400,
    description: 'If the inputModel has incorrect values',
  })
  @ApiResponse({
    status: 429,
    description: 'More than 5 attempts from one IP-address during 10 seconds',
  })
  registrationEmailResending(
    @Body() body: RegistrationEmailResendingInputDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new ResendConfirmationEmailCommand(body.email),
    );
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Password recovery via Email confirmation. Email should be sent with RecoveryCode inside',
  })
  @ApiResponse({
    status: 204,
    description:
      "Even if current email is not registered (for prevent user's email detection)",
  })
  @ApiResponse({
    status: 400,
    description:
      'If the inputModel has invalid email (for example 222^gmail.com)',
  })
  @ApiResponse({
    status: 429,
    description: 'More than 5 attempts from one IP-address during 10 seconds',
  })
  passwordRecovery(@Body() body: PasswordRecoveryInputDto): Promise<void> {
    return this.commandBus.execute(
      new InitiatePasswordRecoveryCommand(body.email),
    );
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Confirm Password recovery' })
  @ApiResponse({
    status: 204,
    description: 'If code is valid and new password is accepted',
  })
  @ApiResponse({
    status: 400,
    description:
      'If the inputModel has incorrect value (for incorrect password length) or RecoveryCode is incorrect or expired',
  })
  @ApiResponse({
    status: 429,
    description: 'More than 5 attempts from one IP-address during 10 seconds',
  })
  newPassword(@Body() body: NewPasswordInputDto): Promise<void> {
    return this.commandBus.execute(
      new ConfirmPasswordRecoveryCommand(body.newPassword, body.recoveryCode),
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Try login user to the system' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        loginOrEmail: { type: 'string', example: 'login123' },
        password: { type: 'string', example: 'superpassword' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns JWT accessToken (expired after 10 seconds) in body and JWT refreshToken in cookie (http-only, secure) (expired after 20 seconds).',
  })
  @ApiResponse({
    status: 400,
    description: 'If the inputModel has incorrect values',
  })
  @ApiResponse({
    status: 401,
    description: 'If the password or login or email is wrong',
  })
  @ApiResponse({
    status: 429,
    description: 'More than 5 attempts from one IP-address during 10 seconds',
  })
  async login(
    @Body() body: LoginInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
    @Ip() ip: string,
    @ParsedUserAgent() deviceTitle: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    const tokens = await this.commandBus.execute<
      LoginUserCommand,
      { accessToken: string; refreshToken: string }
    >(
      new LoginUserCommand({
        userId: user.id,
        ip,
        deviceTitle,
      }),
    );

    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: this.coreConfig.cookieHttpOnly,
      secure: this.coreConfig.cookieSecure,
      sameSite: this.coreConfig.cookieSameSite as 'strict' | 'lax' | 'none',
      path: this.coreConfig.cookiePath,
      maxAge: this.coreConfig.cookieMaxAgeMs,
      domain: this.coreConfig.cookieDomain,
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @UseGuards(RefreshTokenAuthGuard)
  @ApiCookieAuth('refreshToken')
  @ApiOperation({
    summary:
      'Generate new pair of access and refresh tokens (in cookie client must send correct refreshToken that will be revoked after refreshing). Device LastActiveDate should be overrode by issued Date of new refresh token',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns JWT accessToken (expired after 10 seconds) in body and JWT refreshToken in cookie (http-only, secure) (expired after 20 seconds).',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async refreshToken(
    @ExtractRefreshTokenFromRequest() tokenContext: RefreshTokenContextDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    const tokens = await this.commandBus.execute<
      RefreshTokensCommand,
      { accessToken: string; refreshToken: string }
    >(
      new RefreshTokensCommand({
        userId: tokenContext.id,
        deviceId: tokenContext.deviceId,
        iat: tokenContext.iat,
      }),
    );

    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: this.coreConfig.cookieHttpOnly,
      secure: this.coreConfig.cookieSecure,
      sameSite: this.coreConfig.cookieSameSite as 'strict' | 'lax' | 'none',
      path: this.coreConfig.cookiePath,
      maxAge: this.coreConfig.cookieMaxAgeMs,
      domain: this.coreConfig.cookieDomain,
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipThrottle()
  @UseGuards(RefreshTokenAuthGuard)
  @ApiCookieAuth('refreshToken')
  @ApiOperation({
    summary:
      'In cookie client must send correct refreshToken that will be revoked',
  })
  @ApiResponse({
    status: 204,
    description: 'No Content',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async logout(
    @ExtractRefreshTokenFromRequest() tokenContext: RefreshTokenContextDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.commandBus.execute(
      new LogoutUserCommand({
        userId: tokenContext.id,
        deviceId: tokenContext.deviceId,
        iat: tokenContext.iat,
      }),
    );

    response.clearCookie('refreshToken', {
      path: this.coreConfig.cookiePath,
      httpOnly: this.coreConfig.cookieHttpOnly,
      secure: this.coreConfig.cookieSecure,
      sameSite: this.coreConfig.cookieSameSite as 'strict' | 'lax' | 'none',
      domain: this.coreConfig.cookieDomain,
    });
  }

  @ApiBearerAuth()
  @Get('me')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get information about current user' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  me(@ExtractUserFromRequest() user: UserContextDto): Promise<MeViewDto> {
    return this.authQueryRepository.me(user.id);
  }

  @ApiBearerAuth()
  @Get('me-or-default')
  @SkipThrottle()
  @UseGuards(JwtOptionalAuthGuard)
  async meOrDefault(
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<Nullable<MeViewDto>> {
    if (user) {
      return this.authQueryRepository.me(user.id);
    } else {
      return {
        login: 'anonymous',
        userId: null,
        email: null,
        firstName: null,
        lastName: null,
      };
    }
  }
}
