import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './layout';
import { LoginRoute } from '../features/auth/compose/login.route';
import { AuthCallbackRoute } from '../features/auth/compose/callback.route';
import { OnboardingRoute } from '../features/onboarding/compose/onboarding.route';
import { DashboardRoute } from '../features/dashboard/compose/dashboard.route';
import { LotsRoute } from '../features/lot/compose/lots.route';
import { LotCreateRoute } from '../features/lot/compose/lot-create.route';
import { StatisticsRoute } from '../features/statistics/compose/statistics.route';
import { AuthGuard } from '../features/auth/compose/auth-guard';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginRoute /> },
  { path: '/auth/callback', element: <AuthCallbackRoute /> },
  {
    element: (
      <AuthGuard>
        <Layout />
      </AuthGuard>
    ),
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/onboarding', element: <OnboardingRoute /> },
      { path: '/dashboard', element: <DashboardRoute /> },
      { path: '/lots', element: <LotsRoute /> },
      { path: '/lots/new', element: <LotCreateRoute /> },
      { path: '/statistics', element: <StatisticsRoute /> },
    ],
  },
]);
