import { useEffect, useRef } from 'react';
import type { GameType } from '@/hooks/useGameType';
import { ResultCard } from './ResultCard';
import styles from './ResultShareDialog.module.less';
import { useResultCardShare } from './useResultCardShare';

export function ResultSharePreloader({
  gameType,
  matchID,
}: {
  gameType: GameType;
  matchID: string;
}) {
  const exportRef = useRef<HTMLDivElement>(null);
  const share = useResultCardShare({ gameType, matchID });

  useEffect(() => {
    void share.preload();
  }, [share.preload]);

  useEffect(() => {
    if (!share.model || !exportRef.current) return;
    void share.prepare(exportRef.current);
  }, [share.model, share.prepare]);

  if (!share.model) return null;
  return <div
    className={styles.exportNode}
    aria-hidden="true"
    data-result-share-prepared={share.imageReady ? 'true' : 'false'}
  >
    <ResultCard model={share.model} cardRef={exportRef} />
  </div>;
}
