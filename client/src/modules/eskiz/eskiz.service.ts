import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Eskiz } from './eskiz.schema';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EskizService implements OnApplicationBootstrap {
  private readonly logger = new Logger(EskizService.name);
  private token: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(Eskiz)
    private eskizRepository: Repository<Eskiz>,
  ) {}

  async onApplicationBootstrap() {
    await this.login();
  }

  private async login() {
    try {
      const email = this.configService.get<string>('ESKIZ_EMAIL');
      const password = this.configService.get<string>('ESKIZ_PASSWORD');

      const response = await firstValueFrom(
        this.httpService.post('https://notify.eskiz.uz/api/auth/login', {
          email,
          password,
        }),
      );

      this.token = response.data.data.token;
      
      let tokenData = await this.eskizRepository.findOne({ where: { name: 'eskiz-token' } });
      if (tokenData) {
        tokenData.token = this.token;
        await this.eskizRepository.save(tokenData);
      } else {
        const newToken = this.eskizRepository.create({
          name: 'eskiz-token',
          token: this.token,
        });
        await this.eskizRepository.save(newToken);
      }
      
      this.logger.log('Successfully logged in to Eskiz and stored token.');
    } catch (error) {
      this.logger.error('Failed to login to Eskiz:', error.response?.data);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async refreshToken() {
    try {
      const oldToken = await this.eskizRepository.findOne({ where: { name: 'eskiz-token' } });
      if (!oldToken) {
        this.logger.warn('No token found to refresh. Logging in again.');
        return this.login();
      }

      const response = await firstValueFrom(
        this.httpService.patch(
          'https://notify.eskiz.uz/api/auth/refresh',
          {},
          {
            headers: { Authorization: `Bearer ${oldToken.token}` },
          },
        ),
      );

      this.token = response.data.data.token;
      oldToken.token = this.token;
      await this.eskizRepository.save(oldToken);
      this.logger.log('Successfully refreshed Eskiz token.');
    } catch (error) {
      this.logger.error('Failed to refresh Eskiz token:', error.response?.data);
    }
  }

  async sendSms(phone: string, message: string) {
    try {
      const tokenData = await this.eskizRepository.findOne({ where: { name: 'eskiz-token' } });
      if (!tokenData) {
        this.logger.error('Eskiz token not found.');
        return;
      }

      await firstValueFrom(
        this.httpService.post(
          'https://notify.eskiz.uz/api/message/sms/send',
          {
            mobile_phone: phone,
            message: message,
            from: '4546',
          },
          {
            headers: { Authorization: `Bearer ${tokenData.token}` },
          },
        ),
      );

      this.logger.log(`SMS sent to ${phone}`);
    } catch (error) {
      this.logger.error('Failed to send SMS via Eskiz:', error.response?.data);
    }
  }
}