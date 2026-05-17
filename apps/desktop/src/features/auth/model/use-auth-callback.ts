import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthToken } from '../../../shared/ports/auth-token';

export const useAuthCallback = () => {
  const [params] = useSearchParams();
  const { setToken } = useAuthToken();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      setToken(token);
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [params, setToken, navigate]);
};
