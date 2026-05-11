import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { isAbsolute, join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');

  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const uploadRoot = isAbsolute(uploadDir) ? uploadDir : join(process.cwd(), uploadDir);
  app.useStaticAssets(uploadRoot, { prefix: '/api/uploads/' });
  logger.log(`Раздача загруженных файлов: ${uploadRoot} → /api/uploads/`);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:80'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Junior Camp CRM API')
    .setDescription('API для CRM-системы детского лагеря')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Приложение запущено на порту ${port}`);
  logger.log(`Swagger: http://localhost:${port}/api/docs`);
}
bootstrap();
