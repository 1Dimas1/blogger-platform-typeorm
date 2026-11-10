import { INestApplication } from '@nestjs/common';

export function corsSetup(app: INestApplication) {
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://blogger-platform-virid.vercel.app',
      /\.vercel\.app$/, // Allow all Vercel preview deployments
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  });
}
