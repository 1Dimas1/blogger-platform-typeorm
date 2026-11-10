import {
  Controller,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Param,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Constants } from '../../../core/constants';
import { RefreshTokenAuthGuard } from '../guards/refresh-token/refresh-token-auth.guard';
import { ExtractRefreshTokenFromRequest } from '../guards/decorators/param/extract-refresh-token-from-request.decorator';
import { RefreshTokenContextDto } from '../guards/dto/refresh-token-context.dto';
import { DeviceViewDto } from './view-dto/device.view-dto';
import { GetAllUserDevicesQuery } from '../application/queries/get-all-user-devices.query-handler';
import { TerminateAllOtherSessionsCommand } from '../application/usecases/terminate-all-other-sessions.usecase';
import { TerminateDeviceSessionCommand } from '../application/usecases/terminate-device-session.usecase';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@ApiTags('SecurityDevices')
@SkipThrottle()
@Controller(`${Constants.PATH.SECURITY}${Constants.PATH.DEVICES}`)
export class SecurityDevicesController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Get()
  @UseGuards(RefreshTokenAuthGuard)
  @ApiCookieAuth('refreshToken')
  @ApiOperation({
    summary: 'Returns all devices with active sessions for current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: [DeviceViewDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getAllDevices(
    @ExtractRefreshTokenFromRequest() tokenContext: RefreshTokenContextDto,
  ): Promise<DeviceViewDto[]> {
    return this.queryBus.execute<GetAllUserDevicesQuery, DeviceViewDto[]>(
      new GetAllUserDevicesQuery(tokenContext.id),
    );
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenAuthGuard)
  @ApiCookieAuth('refreshToken')
  @ApiOperation({
    summary: "Terminate all other (exclude current) device's sessions",
  })
  @ApiResponse({
    status: 204,
    description: 'No Content',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async terminateAllOtherSessions(
    @ExtractRefreshTokenFromRequest() tokenContext: RefreshTokenContextDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new TerminateAllOtherSessionsCommand({
        userId: tokenContext.id,
        currentDeviceId: tokenContext.deviceId,
        currentIat: tokenContext.iat,
      }),
    );
  }

  @Delete(':deviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenAuthGuard)
  @ApiCookieAuth('refreshToken')
  @ApiOperation({
    summary: 'Terminate specified device session',
  })
  @ApiParam({
    name: 'deviceId',
    description: 'Id of session that will be terminated',
    type: 'string',
  })
  @ApiResponse({
    status: 204,
    description: 'No Content',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'If try to delete the deviceId of other user',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found',
  })
  async terminateDeviceSession(
    @ExtractRefreshTokenFromRequest() tokenContext: RefreshTokenContextDto,
    @Param('deviceId') deviceId: string,
  ): Promise<void> {
    if (deviceId === tokenContext.deviceId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Cannot delete current device',
      });
    }
    await this.commandBus.execute(
      new TerminateDeviceSessionCommand({
        userId: tokenContext.id,
        deviceId,
      }),
    );
  }
}
