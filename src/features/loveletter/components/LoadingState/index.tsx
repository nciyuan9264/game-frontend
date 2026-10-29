import { Heart, Mail } from 'lucide-react';

export function LoveLetterLoading({
  title = '正在整理这封信。',
  description = '正在同步宫廷与在线玩家',
  fullScreen = false,
}: {
  title?: string;
  description?: string;
  fullScreen?: boolean;
}) {
  return <div className={`ll-loading ${fullScreen ? 'full-screen' : ''}`}
    role="status" aria-live="polite" aria-label={description}
    data-game-loading="loveletter">
    <span aria-hidden="true"><Mail size={25} /><Heart size={16} fill="currentColor" /></span>
    <small>PALM LETTER</small><h2>{title}</h2><p>{description}</p>
  </div>;
}
