import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return await auth.ensureSession() ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const studentGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!(await auth.ensureSession())) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  return auth.user()?.role === 'student' ? true : router.createUrlTree(['/admin']);
};

export const adminGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!(await auth.ensureSession())) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  return auth.user()?.role === 'admin' ? true : router.createUrlTree(['/student']);
};
