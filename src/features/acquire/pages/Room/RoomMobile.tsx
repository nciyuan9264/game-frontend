import { Building2, Clock, Wallet } from 'lucide-react';
import {
  GameMobileRoom,
  type GameMobileRoomPlayer,
} from '@/components/GameUI/GameRoomMobile';
import { PlayerAvatar } from '../../components/AppShell';
import tableArt from '../../assets/table-art.webp';
import { playerName } from '../../model/session';
import { roomReadiness, roomSeatOrder, type RoomProps } from './parts';

export function RoomMobile(props: RoomProps) {
  const { data } = props;
  const players = Object.entries(data.players).map(([id, player]) => ({
    id,
    name: playerName(id, data.players),
    avatar: player.avatar,
    ai: player.ai,
    online: player.online,
    ready: player.ready,
    owner: id === data.ownerID,
    self: id === data.playerID,
  } satisfies GameMobileRoomPlayer));
  const byID = Object.fromEntries(players.map(player => [player.id, player]));
  const seats = roomSeatOrder(data).map(id => id ? byID[id] : undefined);
  const readiness = roomReadiness(data);

  return <GameMobileRoom roomID={data.roomID}
    kicker="CLASSIC TABLE · 房间号"
    visibility={data.visibility}
    gameLabel="经典对局"
    players={players}
    seats={seats}
    facts={[
      { icon: <Wallet />, label: '起始资金', value: '$6,000' },
      { icon: <Clock />, label: '阶段时限', value: '20–60 秒' },
      { icon: <Building2 />, label: '公司', value: '7 家' },
    ]}
    summary={[
      { label: '玩法', value: '经典对局' },
      { label: '已入座', value: `${players.length} / 6 人` },
    ]}
    summaryTitle="人齐了，就开场。"
    authorityHint={data.playerID === data.ownerID
      ? '人机添加后自动准备。邀请朋友入座，或直接补上人机，由你开启对局。'
      : '准备好后告诉房主。只有房主可以管理席位和开始对局。'}
    readinessTitle={readiness.reason}
    readinessDescription={data.playerID === data.ownerID
      ? '你是房主，由你开启这一局。'
      : data.players[data.playerID]?.ready
        ? '你已准备，等待房主开始。'
        : '准备好后，告诉房主你已就绪。'}
    owner={data.playerID === data.ownerID}
    enabled={props.enabled}
    pending={props.pending}
    canStart={readiness.canStart}
    media={<img src={tableArt} alt="" />}
    renderAvatar={(player, size) => <PlayerAvatar size={size}
      name={player.name} avatar={player.avatar} ai={player.ai} />}
    onLeave={props.onLeave}
    onSettings={props.onSettings}
    onInvite={props.onInvite}
    onAddAI={props.onAddAI}
    onRemove={props.onRemove}
    onReady={props.onReady}
    onStart={props.onStart}
  />;
}
