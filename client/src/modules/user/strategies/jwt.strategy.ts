import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { UserService } from '../user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req.cookies?.['jwt'];
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your_super_secret_key',
    });
  }

  async validate(payload: { id: number }) {
    const user = await this.userService.findById(payload.id);
    if (!user) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi.');
    }
    // The object returned here will be attached to the request as req.user
    return user;
  }
}
