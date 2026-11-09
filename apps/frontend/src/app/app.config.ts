import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [provideAnimationsAsync(), provideHttpClient(withInterceptors([authInterceptor])), provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' }))],
};
