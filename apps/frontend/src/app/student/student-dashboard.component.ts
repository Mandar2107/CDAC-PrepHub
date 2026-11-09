import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-student-dashboard',
  imports: [RouterLink],
  template: `
    <div class="app-shell" [class.menu-open]="menuOpen()">
      <aside class="sidebar">
        <a class="brand" routerLink="/student"><span class="brand-mark">P</span><span>Prep<span class="brand-light">Hub</span><small>CDAC LEARNING</small></span></a>
        <div class="side-label">LEARN</div>
        <a class="nav-item active" routerLink="/student"><span>◫</span> Overview</a>
        <a class="nav-item"><span>▤</span> My courses</a>
        <a class="nav-item"><span>▧</span> Practice & tests</a>
        <a class="nav-item"><span>◷</span> Study planner</a>
        <div class="side-label side-label-spaced">YOUR SPACE</div>
        <a class="nav-item"><span>☆</span> Bookmarks</a>
        <a class="nav-item"><span>▤</span> Progress</a>
        <div class="sidebar-bottom"><div class="plan-card"><span class="plan-icon">✦</span><b>Unlock your full potential</b><p>Get more practice with PrepHub Premium.</p><button type="button">Explore plans <span>↗</span></button></div><a class="nav-item"><span>⚙</span> Settings</a><a class="nav-item"><span>?</span> Help & support</a><div class="profile"><div class="avatar">{{ auth.user()?.name?.slice(0, 1) ?? 'S' }}</div><div><b>{{ auth.user()?.name ?? 'Student' }}</b><small>{{ auth.user()?.email }}</small></div><button class="profile-more profile-logout" type="button" aria-label="Sign out" (click)="signOut()">↗</button></div></div>
      </aside>
      <main class="main-area">
        <header class="topbar"><button class="mobile-menu" type="button" aria-label="Open menu" (click)="toggleMenu()">☰</button><div class="crumb">Workspace <span>/</span> <b>Overview</b></div><div class="top-actions"><label class="search-box"><span>⌕</span><input aria-label="Search" placeholder="Search anything..."><kbd>⌘ K</kbd></label><button class="icon-button" type="button" aria-label="Notifications">♧<i></i></button><div class="avatar small-avatar">S</div></div></header>
        <div class="page-content">
          <section class="welcome-row"><div><div class="eyebrow"><span class="live-dot"></span> YOUR LEARNING SPACE</div><h1>Welcome back, learner <span>✦</span></h1><p class="subhead">A little progress each day adds up to big results.</p></div><button class="date-pill" type="button">◷ &nbsp; This week <span>⌄</span></button></section>
          <section class="hero-card"><div class="hero-copy"><span class="hero-kicker">YOUR NEXT MILESTONE</span><h2>Build your<br>momentum.</h2><p>Pick up where you left off and keep moving toward your CDAC goals.</p><button class="primary-button" type="button" (click)="continueLearning()">{{ continued() ? 'Coming soon' : 'Continue learning' }} <span>→</span></button></div><div class="hero-art" aria-hidden="true"><div class="orb orb-one"></div><div class="orb orb-two"></div><div class="orbit orbit-a"></div><div class="orbit orbit-b"></div><div class="hero-core"><span>✦</span><b>01</b><small>DAY AT A TIME</small></div><span class="spark spark-a">✦</span><span class="spark spark-b">✧</span><span class="floating-tag">FOCUS MODE <b>ON</b></span></div><div class="hero-number">01 <span>/ 08</span></div></section>
          <section class="metrics-grid"><article class="metric-card"><div class="metric-heading"><span>Study time</span><span class="metric-icon lavender">◷</span></div><div class="metric-value">— <small>hrs</small></div><div class="metric-foot">Your weekly learning time</div><div class="mini-bars" aria-label="Study time chart"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></article><article class="metric-card"><div class="metric-heading"><span>Practice questions</span><span class="metric-icon mint">⌁</span></div><div class="metric-value">— <small>solved</small></div><div class="metric-foot">Keep sharpening your skills</div><div class="metric-progress"><span></span></div><div class="metric-caption">Your activity will show here</div></article><article class="metric-card"><div class="metric-heading"><span>Current streak</span><span class="metric-icon peach">✳</span></div><div class="metric-value">— <small>days</small></div><div class="streak-row"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div><div class="metric-foot">Start a study streak this week</div></article></section>
          <section class="lower-grid"><article class="content-card course-card"><div class="section-heading"><div><span class="eyebrow">YOUR LEARNING PATH</span><h3>Pick up where you left off</h3></div><button class="text-button" type="button">View all <span>→</span></button></div><div class="empty-course"><div class="empty-symbol">▤</div><div><b>No courses assigned yet</b><p>Your courses and lessons will appear here once your account is enrolled.</p></div><button class="outline-button" type="button">Browse courses <span>↗</span></button></div></article><article class="content-card today-card"><div class="section-heading"><div><span class="eyebrow">MAKE TODAY COUNT</span><h3>Quick actions</h3></div><span class="today-icon">✦</span></div><button class="quick-row" type="button"><span class="quick-icon blue">◉</span><span><b>Daily quiz</b><small>Test your knowledge</small></span><span class="quick-arrow">→</span></button><button class="quick-row" type="button"><span class="quick-icon purple">⌕</span><span><b>Explore resources</b><small>Find your next topic</small></span><span class="quick-arrow">→</span></button><button class="quick-row" type="button"><span class="quick-icon green">▧</span><span><b>Practice questions</b><small>Build your confidence</small></span><span class="quick-arrow">→</span></button></article></section>
          <footer class="page-footer"><span>© 2026 PrepHub</span><span>Made for your next big step <b>✦</b></span></footer>
        </div>
      </main>
    </div>
    @if (menuOpen()) { <button class="menu-backdrop" aria-label="Close menu" type="button" (click)="menuOpen.set(false)"></button> }
  `,
})
export class StudentDashboardComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly continued = signal(false);
  readonly menuOpen = signal(false);

  continueLearning(): void { this.continued.set(true); }
  toggleMenu(): void { this.menuOpen.update((isOpen) => !isOpen); }
  async signOut(): Promise<void> { await this.auth.logout().catch(() => undefined); await this.router.navigateByUrl('/login'); }
}
