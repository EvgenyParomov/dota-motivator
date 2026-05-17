import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

type Props = {
  saving: boolean;
  onSubmit: (value: number) => void;
};

export const StartingBalanceStep = ({ saving, onSubmit }: Props) => {
  const [value, setValue] = useState(3);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Стартовый баланс</CardTitle>
        <CardDescription>
          Сколько каток у тебя есть в запасе на старте? Можно указать и отрицательное значение —
          если хочешь начать в долг.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="starting-balance">Баланс</Label>
          <Input
            id="starting-balance"
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </div>
        <Button onClick={() => onSubmit(value)} disabled={saving} className="w-fit">
          <Save />
          {saving ? 'Сохраняю…' : 'Сохранить'}
        </Button>
      </CardContent>
    </Card>
  );
};
