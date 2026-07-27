import { Flag } from 'lucide-react';
import type { Flag as FlagType } from '../../types';
import { Button } from '../ui/Button';

interface Props {
  flags: FlagType[];
  currentUserId: string | undefined;
  onFlag: () => void;
}

export function FlagCell({ flags, currentUserId, onFlag }: Props) {
  const activeFlags = flags.filter((f) => f.status !== 'dismissed');
  const alreadyFlagged = flags.some((f) => f.raisedBy === currentUserId && f.status !== 'dismissed');

  if (alreadyFlagged) {
    return (
      <span className="flex items-center gap-1 text-amber-600">
        <Flag size={11} className="fill-amber-400" />
        <span className="text-[10px] font-medium">Flagged</span>
        {activeFlags.length > 1 && (
          <span className="text-[10px] text-slate-400">+{activeFlags.length - 1}</span>
        )}
      </span>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={onFlag} title="Flag this entry">
      <Flag size={11} />
    </Button>
  );
}
