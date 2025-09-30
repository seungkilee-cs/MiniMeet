import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true, // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Add global validation pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip non-validated properties
      forbidNonWhitelisted: true, // Reject extra properties
      transform: true, // Auto-transform types
      disableErrorMessages: false, // Keep errors for development
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
}
void bootstrap();
