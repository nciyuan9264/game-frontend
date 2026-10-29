import { Dices } from 'lucide-react';
import { Bull } from '../AppShell';

export function CantStopLoading({
  title = '正在整理山路。',
  description = '正在同步骰子、路线与在线玩家',
  fullScreen = false,
}: {
  title?: string;
  description?: string;
  fullScreen?: boolean;
}) {
  return <div className={`cs-loading ${fullScreen ? 'full-screen' : ''}`}
    role="status" aria-live="polite" aria-label={description}
    data-game-loading="cantstop">
    <span aria-hidden="true"><Bull size={28} /><Dices size={17} /></span>
    <small>CAN&apos;T STOP ONLINE</small><h2>{title}</h2><p>{description}</p>
  </div>;
}
