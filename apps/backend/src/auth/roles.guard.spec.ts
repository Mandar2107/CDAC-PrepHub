import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../users/user.entity';
import { ROLES_KEY } from './roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const getAllAndOverride = jest.fn();
  const reflector = { getAllAndOverride } as unknown as Reflector;
  const guard = new RolesGuard(reflector);
  const context = (role?: UserRole) => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
  }) as unknown as ExecutionContext;

  beforeEach(() => jest.clearAllMocks());

  it('allows routes without role metadata', () => {
    getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(context())).toBe(true);
    expect(getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, expect.any(Array));
  });

  it('allows a user with an allowed role', () => {
    getAllAndOverride.mockReturnValue([UserRole.Admin]);
    expect(guard.canActivate(context(UserRole.Admin))).toBe(true);
  });

  it('denies a user with a different role or no session', () => {
    getAllAndOverride.mockReturnValue([UserRole.Admin]);
    expect(guard.canActivate(context(UserRole.Student))).toBe(false);
    expect(guard.canActivate(context())).toBe(false);
  });
});
