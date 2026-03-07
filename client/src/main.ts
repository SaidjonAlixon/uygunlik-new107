import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { UserService } from './modules/user/user.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Cookie parser
  app.use(cookieParser());

  // Create admin user if not exists
  try {
    const userService = app.get(UserService);
    await userService.createAdminIfNotExists();
  } catch (error) {
    console.error('❌ Admin foydalanuvchi yaratishda xatolik:', error.message);
  }

  const port = process.env.PORT || 5000;
  await app.listen(port);
  
  console.log(`🚀 Server is running on http://localhost:${port}`);
  console.log(`📱 Frontend should connect to: http://localhost:${port}`);
  console.log(`💾 Database: PostgreSQL`);
}
bootstrap();