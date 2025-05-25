import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'diary',
    loadComponent: () =>
      import('./components/diary/diary.component').then(
        (m) => m.DiaryComponent,
      ),
  },
  {
    path: 'foods',
    loadComponent: () =>
      import('./components/foods/foods.component').then(
        (m) => m.FoodsComponent,
      ),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./components/reports/reports.component').then(
        (m) => m.ReportsComponent,
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./components/profile/profile.component').then(
        (m) => m.ProfileComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
