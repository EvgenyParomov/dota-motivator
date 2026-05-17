import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
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

type Props = { onSubmit: (value: number) => void };

export const DebtThresholdStep = ({ onSubmit }: Props) => {
  const [value, setValue] = useState(0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Порог долга</CardTitle>
        <CardDescription>
          На сколько каток ты позволишь себе уйти в минус? <strong>0</strong> — нельзя в долг.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="debt-threshold">Порог</Label>
          <Input
            id="debt-threshold"
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </div>
        <Button onClick={() => onSubmit(value)} className="w-fit">
          Дальше
          <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  );
};
