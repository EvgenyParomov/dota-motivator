import { useState } from 'react';
import { Plus } from 'lucide-react';
import { SPHERES, type Sphere, type LotRule, getSphereLabel } from '@dm/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

type Props = {
  submitting: boolean;
  onSubmit(input: { name: string; sphere: Sphere; reward: number; rules: LotRule[] }): void;
};

export const LotForm = ({ submitting, onSubmit }: Props) => {
  const [name, setName] = useState('');
  const [sphere, setSphere] = useState<Sphere>('health');
  const [reward, setReward] = useState(1);
  const [dailyLimit, setDailyLimit] = useState<number | ''>('');
  const [cooldown, setCooldown] = useState<number | ''>('');
  const [oneTime, setOneTime] = useState(false);

  const submit = () => {
    const rules: LotRule[] = [];
    if (oneTime) rules.push({ type: 'one-time' });
    else if (typeof dailyLimit === 'number' && dailyLimit > 0) {
      rules.push({ type: 'daily-limit', count: dailyLimit });
    }
    if (typeof cooldown === 'number' && cooldown > 0) {
      rules.push({ type: 'cooldown', minutes: cooldown });
    }
    onSubmit({ name, sphere, reward, rules });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Новый лот</CardTitle>
        <CardDescription>
          Лот — действие, которое даёт «катки» в баланс. Настрой ограничения, если нужно.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="lot-name">Название</Label>
          <Input
            id="lot-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, утренняя зарядка"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lot-sphere">Сфера</Label>
          <Select value={sphere} onValueChange={(v) => setSphere(v as Sphere)}>
            <SelectTrigger id="lot-sphere" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPHERES.map((s) => (
                <SelectItem key={s} value={s}>
                  {getSphereLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lot-reward">Награда (катки)</Label>
          <Input
            id="lot-reward"
            type="number"
            value={reward}
            step="0.25"
            min="0.25"
            max="10"
            onChange={(e) => setReward(Number(e.target.value))}
          />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Checkbox
            id="lot-one-time"
            checked={oneTime}
            onCheckedChange={(v) => setOneTime(v === true)}
          />
          <Label htmlFor="lot-one-time">Одноразовый</Label>
        </div>
        {!oneTime ? (
          <div className="grid gap-2">
            <Label htmlFor="lot-daily">Лимит в день</Label>
            <Input
              id="lot-daily"
              type="number"
              min="1"
              placeholder="без лимита"
              value={dailyLimit}
              onChange={(e) =>
                setDailyLimit(e.target.value === '' ? '' : Number(e.target.value))
              }
            />
          </div>
        ) : null}
        <div className="grid gap-2">
          <Label htmlFor="lot-cooldown">Кулдаун, мин</Label>
          <Input
            id="lot-cooldown"
            type="number"
            min="0"
            placeholder="без кулдауна"
            value={cooldown}
            onChange={(e) =>
              setCooldown(e.target.value === '' ? '' : Number(e.target.value))
            }
          />
        </div>
        <div className="sm:col-span-2">
          <Button onClick={submit} disabled={submitting || !name} className="w-full sm:w-auto">
            <Plus />
            {submitting ? 'Сохраняю…' : 'Создать лот'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
