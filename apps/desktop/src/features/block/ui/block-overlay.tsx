import { ShieldAlert } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

type Props = {
  open: boolean;
  reason: string;
  onClose: () => void;
};

export const BlockOverlay = ({ open, reason, onClose }: Props) => (
  <Dialog open={open} onOpenChange={(v) => (v ? null : onClose())}>
    <DialogContent showCloseButton={false} className="text-center sm:max-w-md">
      <DialogHeader className="items-center">
        <div className="bg-destructive/10 text-destructive mb-2 flex size-12 items-center justify-center rounded-full">
          <ShieldAlert className="size-6" />
        </div>
        <DialogTitle>Dota закрыта</DialogTitle>
        <DialogDescription>{reason}</DialogDescription>
      </DialogHeader>
      <DialogFooter className="sm:justify-center">
        <Button onClick={onClose}>Понятно</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
