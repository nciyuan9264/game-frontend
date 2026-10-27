import { LoaderCircle, Mail } from 'lucide-react';

export function LoveLetterLoading({
  title = '正在整理这封信。',
  description = '正在同步宫廷与在线玩家',
  fullScreen = false,
}: {
  title?: string;
  description?: string;
  fullScreen?: boolean;
}) {
  return <div className={`ll-loading ${fullScreen ? 'full-screen' : ''}`}>
    <span><Mail size={25} /><LoaderCircle size={16} /></span>
    <small>PALM LETTER</small><h2>{title}</h2><p>{description}</p>
  </div>;
}
