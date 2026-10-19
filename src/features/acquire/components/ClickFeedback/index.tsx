import type { RefObject } from 'react';
import { ClickFeedback as GameClickFeedback, type ClickSound } from '@/components/GameUI/ClickFeedback';
import { playAcquireSound, type AcquireSound } from '../../hooks/useAcquireAudio';

interface Props {
  scopeRef?: RefObject<HTMLElement>;
  playSound?: boolean;
  className?: string;
}

export function ClickFeedback({ scopeRef, playSound = true, className = '' }: Props = {}) {
  return <GameClickFeedback
    scopeRef={scopeRef}
    playSound={playSound}
    className={className}
    soundPlayer={(sound: ClickSound) => playAcquireSound(sound as AcquireSound)}
  />;
}
