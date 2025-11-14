import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);


  // Limit the body 
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  // Request validation (DTO + class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Automatically remove fields that are not in DTO
      forbidNonWhitelisted: false, // If true, any fields not defined in the DTO will cause a validation error
      transform: true,           // Transformation of query/route parameters (string → number etc.)
    }),
  );

  // Global Error Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors(); // During integration, frontend(Next.js) accept CORS 

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  await app.listen(3000);
}
bootstrap();
