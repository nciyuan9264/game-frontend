import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Share2 } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import type { GameType } from '@/hooks/useGameType';
import { ResultShareDialog } from './ResultShareDialog';
import { ResultSharePreloader } from './ResultSharePreloader';

export function ResultShareAction({
  gameType,
  matchID,
}: {
  gameType: GameType;
  matchID: string;
}) {
  const [open, setOpen] = useState(false);
  return <>
    <ResultSharePreloader gameType={gameType} matchID={matchID} />
    <ActionButton
      data-game-final-result-action="share"
      onClick={() => setOpen(true)}
    >
      <Share2 size={16} />分享战绩
    </ActionButton>
    {open && createPortal(<ResultShareDialog
      gameType={gameType}
      matchID={matchID}
      onClose={() => setOpen(false)}
    />, document.body)}
  </>;
}
