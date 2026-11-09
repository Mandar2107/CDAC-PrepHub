import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { SessionUser } from './auth.service';

interface AccessClaims { sub: string; role: UserRole; tokenType: string }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, @InjectRepository(User) private readonly users: Repository<User>) {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET') });
  }

  async validate(payload: AccessClaims): Promise<SessionUser> {
    if (payload.tokenType !== 'access') throw new UnauthorizedException();
    const user = await this.users.findOne({ where: { id: payload.sub, isActive: true } });
    if (!user || user.role !== payload.role) throw new UnauthorizedException();
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}
