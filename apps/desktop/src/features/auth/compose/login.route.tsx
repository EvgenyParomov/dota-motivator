import { Navigate } from 'react-router-dom';
import { LoginScreen } from '../ui/login-screen';
import { useSteamLogin } from '../model/use-steam-login';
import { useAuthToken } from '../../../shared/ports/auth-token';

export const LoginRoute = () => {
  const { token } = useAuthToken();
  const login = useSteamLogin();
  if (token) return <Navigate to="/dashboard" replace />;
  return <LoginScreen starting={login.starting} error={login.error} onStart={login.start} />;
};
