import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { VideoModule } from './modules/video/video.module';
import { CourseModule } from './modules/course/course.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EskizModule } from './modules/eskiz/eskiz.module';
import { VideoStreamModule } from './modules/video-stream/video-stream.module';
import { PurchaseModule } from './modules/purchase/purchase.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/**/*.schema{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      dropSchema: true,
      ssl: process.env.DATABASE_URL?.includes('railway') || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
      logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
    }),
    UserModule,
    VideoModule,
    CourseModule,
    EskizModule,
    VideoStreamModule,
    PurchaseModule,
    MailerModule.forRoot({
      transport: {
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'adella.wehner@ethereal.email',
          pass: 'gscxCYVwZ2VcN4pWfC',
        },
      },
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_secret_key', // TODO: move to .env file
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
