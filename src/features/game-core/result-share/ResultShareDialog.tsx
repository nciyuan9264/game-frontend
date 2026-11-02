import { useEffect, useRef } from 'react';
import { AlertCircle, Check, Copy, ImageDown, RefreshCw, Send } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { ResponsiveDialog } from '@/components/GameUI/ResponsiveDialog';
import { useClipboardCopy } from '@/features/game-core/hooks/useClipboardCopy';
import type { GameType } from '@/hooks/useGameType';
import { ResultCard, ResultCardPreview, RESULT_CARD_URL } from './ResultCard';
import { resultCardTheme } from './themes';
import { useResultCardShare } from './useResultCardShare';
import styles from './ResultShareDialog.module.less';

export function ResultShareDialog({
  gameType,
  matchID,
  onClose,
}: {
  gameType: GameType;
  matchID: string;
  onClose: () => void;
}) {
  const exportRef = useRef<HTMLDivElement>(null);
  const clipboard = useClipboardCopy();
  const share = useResultCardShare({ gameType, matchID });
  const theme = resultCardTheme(gameType);
  const busy = share.status === 'exporting' || share.status === 'sharing';

  useEffect(() => {
    share.open();
  }, [share.open]);

  const close = () => {
    share.close();
    onClose();
  };

  return <ResponsiveDialog
    title={`分享 ${theme.title} 战绩`}
    eyebrow="SHARE YOUR FINAL RESULT"
    onClose={close}
    wide
    className={styles.dialog}
    footer={<>
      <ActionButton onClick={() => void clipboard.copy(RESULT_CARD_URL)}>
        {clipboard.copiedValue === RESULT_CARD_URL
          ? <Check size={16} /> : <Copy size={16} />}
        {clipboard.copiedValue === RESULT_CARD_URL ? '网站地址已复制' : '复制网站地址'}
      </ActionButton>
      <ActionButton
        disabled={!share.model || busy}
        pending={share.status === 'exporting'}
        onClick={() => {
          if (exportRef.current) void share.save(exportRef.current);
        }}
      >
        <ImageDown size={16} />保存图片
      </ActionButton>
      {share.fileShareSupported && <ActionButton
        variant="primary"
        disabled={!share.model || busy}
        pending={share.status === 'sharing'}
        onClick={() => {
          if (exportRef.current) void share.share(exportRef.current);
        }}
      >
        <Send size={16} />分享图片
      </ActionButton>}
    </>}
  >
    {share.status === 'loading' && <div className={styles.loading}>
      <span /><b>正在整理本局战绩</b><p>排名、比分与时长正在生成卡片。</p>
    </div>}
    {share.model && <ResultCardPreview model={share.model} />}
    {share.error && <div className={styles.error}>
      <AlertCircle size={19} /><div><b>战绩卡片暂时无法生成</b>
        <p>{share.error}</p></div>
      <ActionButton onClick={() => void share.retry()}>
        <RefreshCw size={15} />重试
      </ActionButton>
    </div>}
    {share.model && <div className={styles.exportNode} aria-hidden="true">
      <ResultCard model={share.model} cardRef={exportRef} />
    </div>}
  </ResponsiveDialog>;
}
