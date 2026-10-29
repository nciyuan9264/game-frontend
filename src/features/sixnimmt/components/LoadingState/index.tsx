import { Layers3 } from 'lucide-react';
import { Bull } from '../AppShell';

export function SixNimmtLoading({
  title = '正在整理这片牧场。',
  description = '正在同步牌桌与在线玩家',
  fullScreen = false,
}: {
  title?: string;
  description?: string;
  fullScreen?: boolean;
}) {
  return <div className={`sn-loading ${fullScreen ? 'full-screen' : ''}`}
    role="status" aria-live="polite" aria-label={description}
    data-game-loading="sixnimmt">
    <span aria-hidden="true"><Bull size={28} /><Layers3 size={17} /></span>
    <small>6 NIMMT! ONLINE</small><h2>{title}</h2><p>{description}</p>
  </div>;
}
