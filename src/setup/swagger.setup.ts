import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { Constants } from '../core/constants';

export function swaggerSetup(app: INestApplication, isSwaggerEnabled: boolean) {
  if (isSwaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('BLOGGER API')
      .setVersion('1.0')
      .addBearerAuth()
      .addBasicAuth(
        {
          type: 'http',
          scheme: 'basic',
          name: 'basic',
          description: 'Basic Authentication',
        },
        'basicAuth',
      )
      .build();

    const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(Constants.GLOBAL_PREFIX, app, document, {
      customSiteTitle: 'Blogger Swagger',
    });
  }
}
