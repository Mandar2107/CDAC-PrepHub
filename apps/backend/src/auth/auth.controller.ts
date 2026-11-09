import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, SessionUser } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

interface AuthenticatedRequest extends Request { user: SessionUser }
interface RefreshRequest extends Request { cookies: Record<string, string | undefined> }
const REFRESH_COOKIE = 'prephub_rt';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.register(dto);
    this.setRefreshCookie(response, result.tokens.refreshToken);
    return { accessToken: result.tokens.accessToken, user: result.user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(dto);
    this.setRefreshCookie(response, result.tokens.refreshToken);
    return { accessToken: result.tokens.accessToken, user: result.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async refresh(@Req() request: RefreshRequest, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.refresh(request.cookies[REFRESH_COOKIE]);
    this.setRefreshCookie(response, result.tokens.refreshToken);
    return { accessToken: result.tokens.accessToken, user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response): Promise<void> {
    await this.auth.logout(request.user.id);
    response.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  me(@Req() request: AuthenticatedRequest): SessionUser { return request.user; }

  private setRefreshCookie(response: Response, token: string): void {
    response.cookie(REFRESH_COOKIE, token, { ...this.cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });
  }

  private cookieOptions() {
    const sameSite = this.config.get<'strict' | 'lax' | 'none'>('REFRESH_COOKIE_SAME_SITE', 'strict');
    return { httpOnly: true, secure: this.config.get<string>('NODE_ENV') === 'production' || sameSite === 'none', sameSite, path: '/api/auth' };
  }
}
