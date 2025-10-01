import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Environment-based CORS configuration
  const isProduction = process.env.NODE_ENV === 'production';
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : undefined;

  app.enableCors({
    origin: isProduction
      ? corsOrigins || false // Production: use whitelist or deny all
      : true, // Development: allow all origins
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
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
void bootstrap();
