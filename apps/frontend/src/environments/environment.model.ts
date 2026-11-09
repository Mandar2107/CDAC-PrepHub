export interface DemoAccount {
  email: string;
  password: string;
  id: string;
  name: string;
  role: 'student' | 'admin';
}

export interface AppEnvironment {
  apiBaseUrl: string;
  devDashboardPreview: boolean;
  demoAccounts: DemoAccount[];
}
