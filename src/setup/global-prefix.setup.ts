import { INestApplication } from '@nestjs/common';
import { Constants } from '../core/constants';

export function globalPrefixSetup(app: INestApplication) {
  app.setGlobalPrefix(Constants.GLOBAL_PREFIX);
}
