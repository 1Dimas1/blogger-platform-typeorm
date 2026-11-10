import { NestFactory } from '@nestjs/core';
import { appSetup } from './setup/app.setup';
import { createWriteStream } from 'fs';
import { get } from 'http';
import { initAppModule } from './init-app-module';
import { CoreConfig } from './core/core.config';
import { DynamicModule, INestApplication } from '@nestjs/common';

const serverUrl = 'http://localhost:3003';

async function bootstrap() {
  const DynamicAppModule: DynamicModule = await initAppModule();
  const app: INestApplication = await NestFactory.create(DynamicAppModule);

  const coreConfig: CoreConfig = app.get<CoreConfig>(CoreConfig);

  appSetup(app, coreConfig.isSwaggerEnabled);

  const port: number = coreConfig.port;

  await app.listen(port);

  if (coreConfig.env === 'development') {
    get(`${serverUrl}/api/swagger-ui-bundle.js`, function (response) {
      response.pipe(createWriteStream('swagger-static/swagger-ui-bundle.js'));
    });

    get(`${serverUrl}/api/swagger-ui-init.js`, function (response) {
      response.pipe(createWriteStream('swagger-static/swagger-ui-init.js'));
    });

    get(
      `${serverUrl}/api/swagger-ui-standalone-preset.js`,
      function (response) {
        response.pipe(
          createWriteStream('swagger-static/swagger-ui-standalone-preset.js'),
        );
      },
    );

    get(`${serverUrl}/api/swagger-ui.css`, function (response) {
      response.pipe(createWriteStream('swagger-static/swagger-ui.css'));
    });
  }
}
bootstrap();
