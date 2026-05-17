import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';

type Props = {
  form: ReactNode;
};

export const LotCreateLayout = ({ form }: Props) => (
  <div className="flex flex-col gap-4">
    <Button asChild variant="ghost" size="sm" className="w-fit -ml-3">
      <Link to="/lots">
        <ArrowLeft />
        К списку
      </Link>
    </Button>
    {form}
  </div>
);
