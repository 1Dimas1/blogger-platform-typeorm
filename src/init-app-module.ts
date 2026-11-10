import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CoreConfig } from './core/core.config';
import { DynamicModule, INestApplicationContext } from '@nestjs/common';

export async function initAppModule(): Promise<DynamicModule> {
  const appContext: INestApplicationContext =
    await NestFactory.createApplicationContext(AppModule);
  const coreConfig: CoreConfig = appContext.get<CoreConfig>(CoreConfig);
  await appContext.close();

  return AppModule.forRoot(coreConfig);
}
