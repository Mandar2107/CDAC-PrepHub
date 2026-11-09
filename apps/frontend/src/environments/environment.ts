import { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  apiBaseUrl: 'http://localhost:3000/api',
  devDashboardPreview: true,
  demoAccounts: [
    { id: 'dev-student', name: 'PrepHub Student', email: 'student@prephub.local', password: 'Student@PrepHub123', role: 'student' },
    { id: 'dev-admin', name: 'PrepHub Admin', email: 'admin@prephub.local', password: 'Admin@PrepHub123', role: 'admin' },
  ],
};
