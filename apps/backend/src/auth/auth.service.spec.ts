import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/user.entity';

describe('AuthService login', () => {
  const user: User = {
    id: 'student-id', name: 'Aarav', email: 'aarav@example.com', passwordHash: '', role: UserRole.Student,
    refreshTokenHash: null, isActive: true, createdAt: new Date(), updatedAt: new Date(),
  };
  const query = { addSelect: jest.fn(), where: jest.fn(), getOne: jest.fn() };
  const repository = { createQueryBuilder: jest.fn(() => query), save: jest.fn(async (value: User) => value) } as unknown as Repository<User>;
  const jwt = { signAsync: jest.fn() };
  const config = { getOrThrow: jest.fn((key: string) => ({ JWT_ACCESS_SECRET: 'access-secret', JWT_ACCESS_TTL: '15m', JWT_REFRESH_SECRET: 'refresh-secret', JWT_REFRESH_TTL: '7d' })[key]) };
  const service = new AuthService(repository, jwt as never, config as never);

  beforeEach(() => {
    jest.clearAllMocks();
    user.passwordHash = '';
    user.refreshTokenHash = null;
    query.addSelect.mockReturnValue(query);
    query.where.mockReturnValue(query);
    jwt.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
  });

  it('returns an access token and stores only a hash of the rotated refresh token', async () => {
    user.passwordHash = await argon2.hash('strong-password-123');
    query.getOne.mockResolvedValue(user);
    const dto: LoginDto = { email: ' AARAV@example.com ', password: 'strong-password-123' };

    const result = await service.login(dto);

    expect(result).toEqual({ user: { id: 'student-id', name: 'Aarav', email: 'aarav@example.com', role: UserRole.Student }, tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' } });
    expect(user.refreshTokenHash).toBeDefined();
    expect(user.refreshTokenHash).not.toBe('refresh-token');
    await expect(argon2.verify(user.refreshTokenHash!, 'refresh-token')).resolves.toBe(true);
    expect(repository.save).toHaveBeenCalledWith(user);
  });

  it('uses a generic error for an unknown account', async () => {
    query.getOne.mockResolvedValue(null);
    await expect(service.login({ email: 'missing@example.com', password: 'does-not-matter' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
