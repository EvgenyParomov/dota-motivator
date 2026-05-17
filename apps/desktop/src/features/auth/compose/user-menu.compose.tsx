import { useAuthToken } from '../../../shared/ports/auth-token';
import { useMe } from '../model/use-me';
import { useSignOut } from '../model/use-sign-out';
import { UserMenu } from '../ui/user-menu';

export const UserMenuCompose = () => {
  const me = useMe();
  const signOut = useSignOut();
  const { setToken } = useAuthToken();
  return (
    <UserMenu
      name={me.data?.personaName ?? ''}
      avatarUrl={me.data?.avatarUrl ?? null}
      signingOut={signOut.isPending}
      onSignOut={() =>
        signOut.mutate(undefined, { onSuccess: () => setToken(null) })
      }
    />
  );
};
