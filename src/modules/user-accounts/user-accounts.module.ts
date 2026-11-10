import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/user.entity';
import { SecurityDevice } from './domain/security-device.entity';
import { UsersController } from './api/users.controller';
import { UsersRepository } from './infrastructure/users.repository';
import { SecurityDevicesRepository } from './infrastructure/security-devices.repository';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UsersExternalQueryRepository } from './infrastructure/external-query/users.external-query-repository';
import { UsersExternalService } from './application/external/users.external-service';
import { SecurityDevicesQueryRepository } from './infrastructure/query/security-devices.query-repository';
import { AuthQueryRepository } from './infrastructure/query/auth.query-repository';
import { AuthService } from './application/services/auth.service';
import { LocalStrategy } from './guards/local/local.strategy';
import { CryptoService } from './application/services/crypto.service';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { RefreshTokenStrategy } from './guards/refresh-token/refresh-token.strategy';
import { AuthController } from './api/auth.controller';
import { SecurityDevicesController } from './api/security-devices.controller';
import { PassportModule } from '@nestjs/passport';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from './constants/auth-tokens.inject-constants';
import { CreateUserUseCase } from './application/usecases/admins/create-user.usecase';
import { DeleteUserUseCase } from './application/usecases/admins/delete-user.usecase';
import { UpdateUserUseCase } from './application/usecases/update-user.usecase';
import { RegisterUserUseCase } from './application/usecases/users/register-user.usecase';
import { ConfirmRegistrationUseCase } from './application/usecases/users/confirm-registration.usecase';
import { ResendConfirmationEmailUseCase } from './application/usecases/users/resend-confirmation-email.usecase';
import { InitiatePasswordRecoveryUseCase } from './application/usecases/users/initiate-password-recovery.usecase';
import { ConfirmPasswordRecoveryUseCase } from './application/usecases/users/confirm-password-recovery.usecase';
import { LoginUserUseCase } from './application/usecases/login-user.usecase';
import { RefreshTokensUseCase } from './application/usecases/refresh-tokens.usecase';
import { LogoutUserUseCase } from './application/usecases/logout-user.usecase';
import { TerminateDeviceSessionUseCase } from './application/usecases/terminate-device-session.usecase';
import { TerminateAllOtherSessionsUseCase } from './application/usecases/terminate-all-other-sessions.usecase';
import { GetUserByIdQueryHandler } from './application/queries/get-user-by-id.query';
import { GetAllUserDevicesQueryHandler } from './application/queries/get-all-user-devices.query-handler';
import { UsersFactory } from './application/factories/users.factory';
import { SecurityDevicesFactory } from './application/factories/security-devices.factory';
import { UserAccountsConfig } from './config/user-accounts.config';

const commandHandlers = [
  CreateUserUseCase,
  DeleteUserUseCase,
  UpdateUserUseCase,
  RegisterUserUseCase,
  ConfirmRegistrationUseCase,
  ResendConfirmationEmailUseCase,
  InitiatePasswordRecoveryUseCase,
  ConfirmPasswordRecoveryUseCase,
  LoginUserUseCase,
  RefreshTokensUseCase,
  LogoutUserUseCase,
  TerminateDeviceSessionUseCase,
  TerminateAllOtherSessionsUseCase,
];

const queryHandlers = [GetUserByIdQueryHandler, GetAllUserDevicesQueryHandler];

@Module({
  imports: [
    PassportModule,
    JwtModule,
    TypeOrmModule.forFeature([User, SecurityDevice]),
  ],
  controllers: [UsersController, AuthController, SecurityDevicesController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    UsersRepository,
    SecurityDevicesRepository,
    UsersQueryRepository,
    SecurityDevicesQueryRepository,
    AuthQueryRepository,
    AuthService,
    {
      provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (userAccountConfig: UserAccountsConfig): JwtService => {
        return new JwtService({
          secret: userAccountConfig.accessTokenSecret,
          signOptions: { expiresIn: userAccountConfig.accessTokenExpireIn },
        });
      },
      inject: [UserAccountsConfig],
    },
    {
      provide: REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (userAccountConfig: UserAccountsConfig): JwtService => {
        return new JwtService({
          secret: userAccountConfig.refreshTokenSecret,
          signOptions: { expiresIn: userAccountConfig.refreshTokenExpireIn },
        });
      },
      inject: [UserAccountsConfig],
    },
    LocalStrategy,
    RefreshTokenStrategy,
    CryptoService,
    JwtStrategy,
    UserAccountsConfig,
    UsersExternalQueryRepository,
    UsersExternalService,
    UsersFactory,
    SecurityDevicesFactory,
  ],
  exports: [
    UserAccountsConfig,
    JwtStrategy,
    RefreshTokenStrategy,
    UsersExternalQueryRepository,
    UsersExternalService,
  ],
})
export class UserAccountsModule {}
