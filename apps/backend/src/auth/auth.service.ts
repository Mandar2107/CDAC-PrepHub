import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { QueryFailedError, Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User, UserRole } from '../users/user.entity';

export interface SessionUser { id: string; name: string; email: string; role: UserRole }
interface TokenPair { accessToken: string; refreshToken: string }
interface TokenClaims { sub: string; role: UserRole; tokenType: 'access' | 'refresh' }

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: SessionUser; tokens: TokenPair }> {
    const email = dto.email.trim().toLowerCase();
    const user = this.users.create({ name: dto.name.trim(), email, passwordHash: await argon2.hash(dto.password), role: UserRole.Student, refreshTokenHash: null });
    try {
      await this.users.save(user);
    } catch (error: unknown) {
      if (error instanceof QueryFailedError && 'code' in error.driverError && error.driverError.code === '23505') {
        throw new ConflictException('An account with this email already exists.');
      }
      throw error;
    }
    return { user: this.toSessionUser(user), tokens: await this.issueTokens(user) };
  }

  async login(dto: LoginDto): Promise<{ user: SessionUser; tokens: TokenPair }> {
    const user = await this.users.createQueryBuilder('user').addSelect('user.passwordHash').where('user.email = :email', { email: dto.email.trim().toLowerCase() }).getOne();
    if (!user || !user.isActive || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Email or password is incorrect.');
    }
    return { user: this.toSessionUser(user), tokens: await this.issueTokens(user) };
  }

  async refresh(rawToken: string | undefined): Promise<{ user: SessionUser; tokens: TokenPair }> {
    if (!rawToken) throw new UnauthorizedException('Refresh session is missing.');
    let claims: TokenClaims;
    try {
      claims = await this.jwt.verifyAsync<TokenClaims>(rawToken, { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET') });
    } catch {
      throw new UnauthorizedException('Refresh session is invalid or expired.');
    }
    if (claims.tokenType !== 'refresh') throw new UnauthorizedException('Refresh session is invalid.');
    const user = await this.users.createQueryBuilder('user').addSelect('user.refreshTokenHash').where('user.id = :id', { id: claims.sub }).getOne();
    if (!user || !user.isActive || !user.refreshTokenHash || !(await argon2.verify(user.refreshTokenHash, rawToken))) {
      throw new UnauthorizedException('Refresh session has expired. Please sign in again.');
    }
    return { user: this.toSessionUser(user), tokens: await this.issueTokens(user) };
  }

  async logout(userId: string): Promise<void> {
    await this.users.update({ id: userId }, { refreshTokenHash: null });
  }

  private async issueTokens(user: User): Promise<TokenPair> {
    const base = { sub: user.id, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync({ ...base, tokenType: 'access' }, { secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: this.config.getOrThrow<string>('JWT_ACCESS_TTL') as JwtSignOptions['expiresIn'] }),
      this.jwt.signAsync({ ...base, tokenType: 'refresh' }, { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'), expiresIn: this.config.getOrThrow<string>('JWT_REFRESH_TTL') as JwtSignOptions['expiresIn'] }),
    ]);
    user.refreshTokenHash = await argon2.hash(refreshToken);
    await this.users.save(user);
    return { accessToken, refreshToken };
  }

  toSessionUser(user: User): SessionUser { return { id: user.id, name: user.name, email: user.email, role: user.role }; }
}
