import type { CSSProperties, ReactNode } from 'react';

export interface GameAvatarProps {
  name: string;
  avatar?: string;
  ai?: boolean;
  size?: number;
  className?: string;
  renderFallback: (props: {
    name: string;
    ai?: boolean;
    size: number;
  }) => ReactNode;
}

export function GameAvatar({
  name,
  avatar,
  ai,
  size = 36,
  className,
  renderFallback,
}: GameAvatarProps) {
  const style: CSSProperties = { width: size, height: size };
  return <span className={className} style={style} aria-hidden="true">
    {avatar
      ? <img src={avatar} alt="" referrerPolicy="no-referrer" />
      : renderFallback({ name, ai, size })}
  </span>;
}
