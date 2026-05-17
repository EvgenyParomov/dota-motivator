import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { PageLoader } from '@/shared/ui/page-loader';
import { useAuthSession } from '../model/use-auth-session';

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { status } = useAuthSession();
  const location = useLocation();

  if (status === 'anonymous') return <Navigate to="/login" replace />;
  if (status === 'loading') return <PageLoader />;
  if (status === 'invalid')
    return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
};
