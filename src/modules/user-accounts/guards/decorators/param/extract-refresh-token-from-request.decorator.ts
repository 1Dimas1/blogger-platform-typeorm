import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RefreshTokenContextDto } from '../../dto/refresh-token-context.dto';

export const ExtractRefreshTokenFromRequest = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RefreshTokenContextDto => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as RefreshTokenContextDto;
  },
);
