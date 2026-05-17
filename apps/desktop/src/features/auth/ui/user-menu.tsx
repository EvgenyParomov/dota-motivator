import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';

type Props = {
  name: string;
  avatarUrl: string | null;
  signingOut: boolean;
  onSignOut: () => void;
};

export const UserMenu = ({ name, avatarUrl, signingOut, onSignOut }: Props) => (
  <div className="flex items-center gap-3 rounded-md px-2 py-2">
    <Avatar className="size-8">
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback className="text-xs">
        {name.slice(0, 2).toUpperCase() || '??'}
      </AvatarFallback>
    </Avatar>
    <div className="text-sidebar-foreground min-w-0 flex-1 truncate text-sm font-medium">
      {name || 'Профиль'}
    </div>
    <Button
      variant="ghost"
      size="icon"
      onClick={onSignOut}
      disabled={signingOut}
      aria-label="Выйти"
      title="Выйти"
    >
      <LogOut />
    </Button>
  </div>
);
