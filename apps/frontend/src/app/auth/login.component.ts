import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService, UserRole } from './auth.service';
import { environment } from '../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-layout"><section class="auth-aside"><a class="brand" routerLink="/"><span class="brand-mark">P</span><span>Prep<span class="brand-light">Hub</span><small>CDAC LEARNING</small></span></a><div class="auth-message"><span class="hero-kicker">YOUR NEXT CHAPTER STARTS HERE</span><h1>Small steps.<br>Big futures.</h1><p>A focused space to prepare, practice, and move closer to your CDAC goals.</p><div class="auth-aside-art"><div class="auth-ring ring-one"></div><div class="auth-ring ring-two"></div><div class="auth-star">✦</div><span>LEARN WITH PURPOSE</span></div></div><small class="auth-legal">© 2026 PrepHub</small></section><section class="auth-main"><div class="auth-card"><div class="auth-mobile-brand"><a class="brand" routerLink="/"><span class="brand-mark">P</span><span>Prep<span class="brand-light">Hub</span></span></a></div><div class="auth-eyebrow"><span class="live-dot"></span> YOUR LEARNING SPACE</div><h2>{{ registering() ? 'Create your account' : 'Welcome back' }}</h2><p class="auth-subtitle">{{ registering() ? 'Start preparing with a plan built around you.' : 'Sign in to continue your preparation journey.' }}</p>
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (registering()) { <label class="field-label" for="name">Full name</label><input id="name" class="auth-input" formControlName="name" autocomplete="name" placeholder="Your name"> }
        <label class="field-label" for="email">Email address</label><input id="email" class="auth-input" formControlName="email" autocomplete="email" type="email" placeholder="you@example.com">
        <label class="field-label" for="password">Password</label><input id="password" class="auth-input" formControlName="password" autocomplete="{{ registering() ? 'new-password' : 'current-password' }}" type="password" placeholder="{{ registering() ? 'At least 12 characters' : 'Enter your password' }}">
        @if (error()) { <div class="auth-error" role="alert">{{ error() }}</div> }
        <button class="auth-submit" type="submit" [disabled]="loading() || form.invalid">{{ loading() ? 'Please wait…' : registering() ? 'Create account' : 'Sign in' }} <span>→</span></button>
      </form>
      <div class="auth-switch">{{ registering() ? 'Already have an account?' : 'New to PrepHub?' }} <button type="button" (click)="toggleMode()">{{ registering() ? 'Sign in' : 'Create an account' }}</button></div>
      @if (demoAuthEnabled() && !registering()) { <section class="demo-accounts"><b>Local preview accounts</b><small>Development only · no real student data</small>@for (account of demoAccounts; track account.id) { <div><span><strong>{{ account.role === 'student' ? 'Student' : 'Admin' }}</strong><code>{{ account.email }}</code><code>{{ account.password }}</code></span><button type="button" (click)="useDemo(account.role)">Use</button></div> }</section> }
      <div class="auth-security"><span>♧</span> Your account is protected with secure sign-in.</div>
    </div></section></main>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly registering = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly demoAuthEnabled = signal(environment.devDashboardPreview && environment.demoAccounts.length > 0);
  readonly demoAccounts = environment.demoAccounts;
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(128)]],
  });

  toggleMode(): void {
    this.registering.update((value) => !value);
    this.error.set('');
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(this.registering() ? 12 : 1), Validators.maxLength(128)]);
    this.form.controls.name.setValidators(this.registering() ? [Validators.required, Validators.minLength(2), Validators.maxLength(120)] : []);
    this.form.controls.name.updateValueAndValidity();
    this.form.controls.password.updateValueAndValidity();
  }

  useDemo(role: UserRole): void {
    if (!environment.devDashboardPreview) return;
    if (this.registering()) this.toggleMode();
    const account = environment.demoAccounts.find((candidate) => candidate.role === role);
    if (!account) return;
    this.error.set('');
    this.form.patchValue({ email: account.email, password: account.password });
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading()) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    try {
      const values = this.form.getRawValue();
      const user = this.registering()
        ? await firstValueFrom(this.auth.register({ name: values.name.trim(), email: values.email.trim(), password: values.password }))
        : await firstValueFrom(this.auth.login({ email: values.email.trim(), password: values.password }));
      const requestedPath = this.route.snapshot.queryParamMap.get('returnUrl');
      const safePath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : null;
      await this.router.navigateByUrl(safePath ?? (user.role === 'admin' ? '/admin' : '/student'));
    } catch (reason: unknown) {
      const response = reason instanceof HttpErrorResponse ? reason : null;
      const detail = response?.error?.message;
      this.error.set(Array.isArray(detail) ? detail[0] : typeof detail === 'string' ? detail : 'We could not complete that sign-in. Check your details and try again.');
    } finally { this.loading.set(false); }
  }
}
