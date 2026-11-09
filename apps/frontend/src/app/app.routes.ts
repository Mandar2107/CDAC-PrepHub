import { Routes } from '@angular/router';
import { adminGuard, studentGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/login.component').then((m) => m.LoginComponent) },
  { path: 'student', canActivate: [studentGuard], loadComponent: () => import('./student/student-dashboard.component').then((m) => m.StudentDashboardComponent) },
  { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent) },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
