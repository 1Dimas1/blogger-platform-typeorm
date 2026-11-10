import { pipesSetup } from './pipes.setup';
import { INestApplication } from '@nestjs/common';
import { globalPrefixSetup } from './global-prefix.setup';
import { corsSetup } from './cors.setup';
import { swaggerSetup } from './swagger.setup';
import { cookieSetup } from './cookie.setup';

export function appSetup(app: INestApplication, isSwaggerEnabled: boolean) {
  corsSetup(app);
  cookieSetup(app);
  globalPrefixSetup(app);
  pipesSetup(app);
  swaggerSetup(app, isSwaggerEnabled);
}
