import { Grid3X3, ShieldCheck, Timer } from 'lucide-react';
import { StandardGameMobileRoom } from '@/components/GameUI/GameRoomMobile';
import { PlayerAvatar } from '../../components/AppShell';
import { Disc } from '../../components/Artwork';
import { playerName } from '../../model/session';
import { type RoomProps } from './parts';
import styles from './index.module.less';

export function RoomMobile(props: RoomProps & { onLeave: () => void }) {
  const { data } = props;
  const playerCount = Object.keys(data.players).length;
  return <StandardGameMobileRoom
    data={data}
    enabled={props.enabled}
    pending={props.pending}
    getPlayerName={id => playerName(id, data.players)}
    renderAvatar={(player, size) => <PlayerAvatar name={player.name}
      avatar={player.avatar} ai={player.ai} size={size} />}
    renderSeatDecoration={(_player, index) => <Disc
      side={index === 0 ? 'red' : 'teal'} className={styles.sideMarker} />}
    copy={{
      kicker: 'A TABLE FOR TWO · 房间号',
      gameLabel: '经典连边棋',
      facts: [
        { icon: <Grid3X3 />, label: '棋盘', value: '11 × 11' },
        { icon: <Timer />, label: '回合', value: '60 秒' },
        { icon: <ShieldCheck />, label: '规则', value: 'Pie rule' },
      ],
      summary: [
        { label: '玩法', value: '11 × 11 · Pie rule' },
        { label: '已入座', value: `${playerCount} / 2 人` },
      ],
      summaryEyebrow: 'BEFORE THE FIRST STEP',
      summaryTitle: '人齐了，就开场。',
      ownerHint: '邀请朋友入座，或添加自动准备的人机棋手，由你开启对局。',
      memberHint: '准备好后等待房主开局。只有房主可以管理席位。',
      readyTitle: '双方就绪，好局即将开始。',
      ownerDescription: '你是房主，由你落下开局指令。',
      memberReadyDescription: '你已准备，等待房主开始。',
      memberWaitingDescription: '准备好后告诉房主你已就绪。',
    }}
    media={<div className={styles.boardPattern} aria-hidden="true" />}
    onLeave={props.onLeave}
    onSettings={props.onSettings}
    onInvite={props.onInvite}
    onAddAI={props.onAddAI}
    onRemove={props.onRemove}
    onReady={props.onReady}
    onStart={props.onStart}
  />;
}
