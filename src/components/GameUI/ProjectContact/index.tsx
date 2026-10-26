import type { ReactNode } from 'react';
import {
  Check,
  Code2,
  Copy,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { useClipboardCopy } from '@/features/game-core/hooks/useClipboardCopy';

const AUTHOR = 'nciyuan9264';
const AUTHOR_QQ = '1522457543';
const REPOSITORY_URL = 'https://github.com/nciyuan9264/game-frontend';

export interface ProjectContactClasses {
  intro?: string;
  links?: string;
  legal?: string;
}

export function ProjectContact({
  gameName,
  avatar,
  classes,
}: {
  gameName: string;
  avatar: ReactNode;
  classes: ProjectContactClasses;
}) {
  const clipboard = useClipboardCopy();
  const copied = clipboard.copiedValue === AUTHOR_QQ;

  return <>
    <div className={classes.intro}>
      {avatar}
      <div>
        <small>DESIGNED & BUILT BY</small>
        <h3>{AUTHOR}</h3>
        <p>独立设计、开发并维护这个在线 {gameName} 游戏。</p>
      </div>
    </div>
    <div className={classes.links}>
      <button type="button" onClick={() => void clipboard.copy(AUTHOR_QQ)}>
        <MessageCircle size={19} />
        <span>
          <b>{copied ? 'QQ 已复制' : 'QQ 联系作者'}</b>
          <small>{AUTHOR_QQ}</small>
        </span>
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
      <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">
        <Code2 size={19} />
        <span>
          <b>查看项目源码</b>
          <small>nciyuan9264/game-frontend</small>
        </span>
        <ExternalLink size={15} />
      </a>
    </div>
    <p className={classes.legal}>
      本项目是非官方在线实现。游戏名称、规则及相关商标归其各自权利人所有。
    </p>
  </>;
}
