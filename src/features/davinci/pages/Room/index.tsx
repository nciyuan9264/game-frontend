import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Globe,
  KeyRound,
  ListOrdered,
  Lock,
  Plus,
  Settings2,
  ShieldCheck,
  Timer,
  UserPlus,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import {
  StandardGameMobileRoom,
  StandardGameMobileRoomDialogs,
} from '@/components/GameUI/GameRoomMobile';
import { ResponsiveDialog } from '@/components/GameUI/ResponsiveDialog';
import { useMobileViewport } from '@/features/game-core/hooks/useMobileViewport';
import { PlayerAvatar } from '../../components/AppShell';
import type { DavinciSession } from '../../hooks/useDavinciSession';
import { davinciRoomInviteURL } from '../../model/adapters';
import { playerLabel, playerName, type MatchSnapshot } from '../../model/session';
import type { Visibility } from '../../model/types';
import rootStyles from '../../styles/root.module.less';
import {
  RoomFacts,
  StartBar,
  TablePanel,
  type RoomProps,
} from './parts';
import styles from './index.module.less';

export function Room({
  session,
  data,
  onLeave,
}: {
  session: DavinciSession;
  data: MatchSnapshot;
  onLeave: () => void;
}) {
  const { isMobile } = useMobileViewport();
  const [panel, setPanel] = useState<
    'invite' | 'settings' | 'remove' | 'start'
  >();
  const [target, setTarget] = useState('');
  const [visibility, setVisibility] = useState<Visibility>(data.visibility);
  const [copyMessage, setCopyMessage] = useState('');
  const enabled = session.connection.status === 'connected' && !session.pending;
  const owner = data.playerID === data.ownerID;
  const players = Object.entries(data.players);
  const inviteURL = davinciRoomInviteURL(data.roomID);
  const close = () => setPanel(undefined);
  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(message);
    } catch {
      setCopyMessage('复制未成功，请稍后重试');
    }
  };
  const roomProps: RoomProps = {
    data,
    enabled,
    pending: !!session.pending,
    onAddAI: (seatIndex?: number) => {
      session.submit(
        'match_add_ai',
        typeof seatIndex === 'number' ? { seatIndex } : {},
      );
    },
    onRemove: (playerID: string) => {
      setTarget(playerID);
      setPanel('remove');
    },
    onReady: () => {
      session.submit('match_ready', {
        ready: !data.players[data.playerID]?.ready,
      });
    },
    onStart: () => setPanel('start'),
    onInvite: () => {
      setCopyMessage('');
      setPanel('invite');
    },
  };
  const getPlayerName = (playerID: string) =>
    playerName(playerID, data.players);
  const renderMobileAvatar = (
    player: {
      name: string;
      avatar?: string;
      ai: boolean;
    },
    size: number,
  ) => <PlayerAvatar name={player.name} avatar={player.avatar}
    ai={player.ai} size={size} />;
  const saveSettings = () => {
    if (session.submit('room_update_settings', { visibility })) close();
  };
  const confirmRemove = () => {
    if (session.submit('match_remove_player', { playerID: target })) close();
  };
  const confirmStart = () => {
    if (session.submit('match_begin')) close();
  };

  if (isMobile) {
    return <div className={styles.page}>
      <StandardGameMobileRoom
        data={data}
        enabled={enabled}
        pending={!!session.pending}
        getPlayerName={getPlayerName}
        getPlayerRole={(playerID, player) => playerID === data.ownerID
          ? '房主'
          : player.ai ? 'AI 对手' : '挑战者'}
        renderAvatar={renderMobileAvatar}
        copy={{
          kicker: 'CIPHER ROOM · 房间号',
          gameLabel: '经典解码',
          facts: [
            { icon: <ListOrdered />, label: '初始牌', value: '5 张' },
            { icon: <Timer />, label: '阶段', value: '20–60 秒' },
            { icon: <ShieldCheck />, label: '规则', value: '服务端验证' },
          ],
          summary: [
            { label: '玩法', value: '经典解码' },
            { label: '已入座', value: `${players.length} / 2 人` },
          ],
          summaryEyebrow: 'BEFORE THE FIRST GUESS',
          summaryTitle: '人齐了，就开场。',
          ownerHint: '邀请朋友入座，或添加自动准备的人机棋手，由你开启对局。',
          memberHint: '准备好后等待房主开局。只有房主可以管理席位。',
          readyTitle: '双方就绪，密码对决即将开始。',
          ownerDescription: '你是房主，由你开启这场密码对决。',
          memberReadyDescription: '你已准备，等待房主开始。',
          memberWaitingDescription: '准备好后告诉房主你已就绪。',
        }}
        media={<div className={styles.cipherPattern} aria-hidden="true" />}
        onLeave={onLeave}
        onSettings={() => {
          setVisibility(data.visibility);
          setPanel('settings');
        }}
        onInvite={roomProps.onInvite}
        onAddAI={roomProps.onAddAI}
        onRemove={roomProps.onRemove}
        onReady={roomProps.onReady}
        onStart={roomProps.onStart}
      />
      <StandardGameMobileRoomDialogs
        panel={panel}
        data={data}
        targetID={target}
        visibility={visibility}
        copyMessage={copyMessage}
        enabled={enabled}
        getPlayerName={getPlayerName}
        renderAvatar={renderMobileAvatar}
        inviteTitle="给朋友留一个密码席位"
        settingsHint={visibility === 'private'
          ? '私密房间不会向其他玩家公开展示。'
          : '公开房间可以从大厅、房间号或邀请链接加入。'}
        startTitle="开始这场密码对决？"
        startFacts={[
          { icon: <KeyRound />, label: '手牌', value: '5 张' },
          { icon: <Timer />, label: '阶段', value: '20–60 秒' },
          { icon: <ShieldCheck />, label: '人数', value: '固定 2 人' },
        ]}
        startHint="开局后每位玩家获得 5 张密码牌。先揭开对手全部牌的一方获胜。"
        themeClassName={rootStyles.root}
        onVisibilityChange={setVisibility}
        onCopyRoomID={() => void copy(data.roomID, '房间号已复制')}
        onCopyInviteURL={() => void copy(inviteURL, '邀请链接已复制')}
        onSaveSettings={saveSettings}
        onConfirmRemove={confirmRemove}
        onConfirmStart={confirmStart}
        onClose={close}
      />
    </div>;
  }

  return <div className={styles.page}>
    <header className={styles.heading} data-game-room-heading>
      <div className={styles.headingIdentity} data-game-room-heading-identity>
        <button
          type="button"
          className={styles.backButton}
          data-game-room-heading-back
          aria-label="离开当前房间"
          onClick={onLeave}
        >
          <ArrowLeft size={19} />
        </button>
        <div data-game-room-heading-copy>
          <small data-game-room-heading-kicker>CIPHER ROOM · 房间号</small>
          <h1 data-game-room-heading-title>{data.roomID}<span>准备中</span></h1>
        </div>
      </div>
      <div data-game-room-heading-actions>
        {owner && <ActionButton onClick={() => {
          setVisibility(data.visibility);
          setPanel('settings');
        }}>
          <Settings2 size={15} />房间设置
        </ActionButton>}
        <ActionButton variant="primary" onClick={roomProps.onInvite}>
          <UserPlus size={15} />邀请好友
        </ActionButton>
      </div>
    </header>

    <div className={styles.roomLayout}>
      <TablePanel {...roomProps} />
      <RoomFacts {...roomProps} />
    </div>
    <StartBar {...roomProps} />

    {panel === 'invite' && <ResponsiveDialog
      title="给朋友留一个密码席位"
      eyebrow="INVITE TO THE CIPHER TABLE"
      themeClassName={rootStyles.root}
      onClose={close}
      footer={<>
        <ActionButton onClick={() =>
          void copy(data.roomID, '房间号已复制')}>
          <Copy size={15} />复制房间号
        </ActionButton>
        <ActionButton variant="primary" onClick={() =>
          void copy(inviteURL, '邀请链接已复制')}>
          <Copy size={15} />复制邀请链接
        </ActionButton>
      </>}
    >
      <div className={styles.invitePlayers}>
        {players.map(([id, player]) => <PlayerAvatar
          key={id}
          name={playerName(id, data.players)}
          avatar={player.avatar}
          ai={player.ai}
          size={45}
        />)}
        {players.length < 2 && <span><Plus size={20} /></span>}
      </div>
      <p className={`${styles.dialogText} ${styles.center}`}>
        分享完整链接，对手登录后会直接进入房间 {data.roomID}。
      </p>
      <div className={styles.inviteCode}>
        <span>ROOM NUMBER</span>
        <input
          aria-label="分享房间号"
          value={data.roomID}
          readOnly
          onClick={event => event.currentTarget.select()}
        />
        <small>经典解码 · {players.length} / 2 人 · {
          data.visibility === 'private' ? '私密' : '公开'
        }</small>
      </div>
      <div className={styles.dialogHint}>
        <ShieldCheck size={15} />
        <span>{copyMessage || (data.visibility === 'private'
          ? '私密房间需通过完整房间号或邀请链接加入。'
          : '邀请链接不包含玩家身份信息。')}</span>
      </div>
    </ResponsiveDialog>}

    {owner && panel === 'settings' && <ResponsiveDialog
      title="房间设置"
      eyebrow="ROOM VISIBILITY"
      themeClassName={rootStyles.root}
      onClose={close}
      footer={<>
        <ActionButton onClick={close}>取消</ActionButton>
        <ActionButton
          variant="primary"
          disabled={!enabled}
          onClick={() => {
            if (session.submit('room_update_settings', { visibility })) {
              close();
            }
          }}
        >
          保存设置<ArrowRight size={15} />
        </ActionButton>
      </>}
    >
      <p className={styles.dialogText}>选择这张密码桌如何被其他玩家找到。</p>
      <div className={styles.settings}>
        {(['public', 'private'] as const).map(value => <button
          type="button"
          key={value}
          disabled={!enabled}
          aria-pressed={visibility === value}
          onClick={() => setVisibility(value)}
        >
          {value === 'public' ? <Globe size={21} /> : <Lock size={21} />}
          <span>
            <b>{value === 'public' ? '公开房间' : '私密房间'}</b>
            <small>{value === 'public'
              ? '展示在大厅，其他玩家可加入'
              : '凭完整房间号或邀请链接加入'}</small>
          </span>
          {visibility === value && <Check size={14} />}
        </button>)}
      </div>
      <div className={styles.dialogHint}>
        <ShieldCheck size={15} />
        <span>{visibility === 'private'
          ? '私密房间不会向其他玩家公开展示。'
          : '公开房间可以从大厅、房间号或邀请链接加入。'}</span>
      </div>
    </ResponsiveDialog>}

    {panel === 'remove' && <ResponsiveDialog
      title="让这个席位空出来？"
      eyebrow="REMOVE PLAYER"
      themeClassName={rootStyles.root}
      onClose={close}
      footer={<>
        <ActionButton onClick={close}>取消</ActionButton>
        <ActionButton
          variant="danger"
          disabled={!enabled}
          onClick={() => {
            if (session.submit('match_remove_player', { playerID: target })) {
              close();
            }
          }}
        >
          确认移除
        </ActionButton>
      </>}
    >
      <p className={styles.dialogText}>
        {playerLabel(target, data.players)} 将离开当前房间。
      </p>
    </ResponsiveDialog>}

    {panel === 'start' && <ResponsiveDialog
      title="开始这场密码对决？"
      eyebrow="READY TO DECODE"
      themeClassName={rootStyles.root}
      onClose={close}
      footer={<>
        <ActionButton onClick={close}>再等一下</ActionButton>
        <ActionButton
          variant="primary"
          disabled={!enabled}
          onClick={() => {
            if (session.submit('match_begin')) close();
          }}
        >
          确认开局<ArrowRight size={16} />
        </ActionButton>
      </>}
    >
      <div className={styles.startPlayers}>
        {players.map(([id, player]) => <span key={id}>
          <PlayerAvatar
            name={playerName(id, data.players)}
            avatar={player.avatar}
            ai={player.ai}
            size={50}
          />
          <b>{playerLabel(id, data.players)}</b>
          <small><Check size={12} />
            {player.ready ? '准备就绪' : '尚未准备'}</small>
        </span>)}
      </div>
      <p className={styles.startCopy}>
        开局后每位玩家获得 5 张密码牌。先揭开对手全部牌的一方获胜。
      </p>
    </ResponsiveDialog>}
  </div>;
}
