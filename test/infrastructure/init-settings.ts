import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { UsersTestManager } from '../helpers/users-test-manager';
import { deleteAllData } from '../utils/delete-all-data';
import { EmailServiceMock } from '../mocks/email-service.mock';
import { initAppModule } from '../../src/init-app-module';
import { EmailService } from '../../src/modules/notifications/email.service';
import { CoreConfig } from '../../src/core/core.config';
import { appSetup } from '../../src/setup/app.setup';
import { DynamicModule, INestApplication } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { AuthRepository } from '../auth/auth.repository';
import { SecurityDevicesRepository } from '../security-devices/security-devices.repository';
import { BlogsRepository } from '../blogs/blogs.repository';
import { PostsRepository } from '../posts/posts.repository';
import { CommentsRepository } from '../comments/comments.repository';

export const initSettings = async (
  addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
) => {
  const DynamicAppModule: DynamicModule = await initAppModule();
  const testingModuleBuilder: TestingModuleBuilder = Test.createTestingModule({
    imports: [DynamicAppModule],
  })
    .overrideProvider(EmailService)
    .useClass(EmailServiceMock);

  if (addSettingsToModuleBuilder) {
    addSettingsToModuleBuilder(testingModuleBuilder);
  }

  const testingAppModule: TestingModule = await testingModuleBuilder.compile();

  const app: INestApplication = testingAppModule.createNestApplication();
  const coreConfig: CoreConfig = app.get<CoreConfig>(CoreConfig);
  appSetup(app, coreConfig.isSwaggerEnabled);

  await app.init();

  const httpServer = app.getHttpServer();

  // Legacy test manager (kept for backward compatibility)
  const userTestManger = new UsersTestManager(app);

  // New repository pattern
  const usersRepository = new UsersRepository(httpServer);
  const authRepository = new AuthRepository(httpServer);
  const securityDevicesRepository = new SecurityDevicesRepository(httpServer);
  const blogsRepository = new BlogsRepository(httpServer);
  const postsRepository = new PostsRepository(httpServer);
  const commentsRepository = new CommentsRepository(httpServer);

  await deleteAllData(app);

  return {
    app,
    httpServer,

    // Legacy (backward compatibility)
    userTestManger,

    // New pattern (repositories)
    usersRepository,
    authRepository,
    securityDevicesRepository,
    blogsRepository,
    postsRepository,
    commentsRepository,
  };
};
