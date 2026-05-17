import { PageLoader } from '@/shared/ui/page-loader';
import { useAuthCallback } from '../model/use-auth-callback';

export const AuthCallbackRoute = () => {
  useAuthCallback();
  return <PageLoader message="Завершаю вход…" />;
};
