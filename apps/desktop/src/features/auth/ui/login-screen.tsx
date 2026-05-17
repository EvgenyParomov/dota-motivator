import { Gamepad2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';

type Props = {
  starting: boolean;
  error: string | null;
  onStart: () => void;
};

export const LoginScreen = ({ starting, error, onStart }: Props) => (
  <div className="bg-background flex min-h-screen items-center justify-center px-4">
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <div className="bg-primary/10 text-primary mb-2 flex size-12 items-center justify-center rounded-full">
          <Gamepad2 className="size-6" />
        </div>
        <CardTitle className="text-xl">Dota Motivator</CardTitle>
        <CardDescription>Войди через Steam, чтобы начать.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button className="w-full" onClick={onStart} disabled={starting}>
          {starting ? 'Открываю Steam…' : 'Войти через Steam'}
        </Button>
        {error ? (
          <p className="text-destructive text-center text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  </div>
);
