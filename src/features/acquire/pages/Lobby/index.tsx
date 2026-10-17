import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCode } from 'antd';
import { ArrowRight, Check, Copy, Globe, KeyRound, Lock, QrCode, ShieldCheck } from 'lucide-react';
import { getProfile } from '@/api/room';
import { getMyStats } from '@/api/history';
import { profile2BackendName } from '@/util/user';
import { createAcquireRoom, lookupRoom } from '../../api/room';
import { AppShell } from '../../components/AppShell';
import { ActionButton } from '../../components/ActionButton';
import { Feedback } from '../../components/Panel';
import { AcquireLoading } from '../../components/LoadingState';
import { ResponsiveDialog } from '../../components/ResponsiveDialog';
import { StockPrices } from '../../dialogs/StockPrices';
import { RoomCard } from '../../components/RoomCard';
import { useAcquireLobby } from '../../hooks/useAcquireLobby';
import { useAcquireResource } from '../../hooks/useAcquireResource';
import { useAcquireViewport } from '../../hooks/useAcquireViewport';
import { ACQUIRE_PUBLIC_URL, roomEntry } from '../../model/adapters';
import { companyPriceTiers, type AcquireRoom, type Visibility } from '../../model/types';
import { LobbyDesktop } from './LobbyDesktop';
import { LobbyMobile } from './LobbyMobile';
import styles from './index.module.less';

const loadStats = () => getMyStats('acquire');

export default function Lobby() {
  const navigate = useNavigate();
  const lobby = useAcquireLobby();
  const profile = useAcquireResource(getProfile);
  const stats = useAcquireResource(loadStats);
  const { isMobile } = useAcquireViewport();
  const [panel, setPanel] = useState<'create' | 'join' | 'share'>();
  const [shareCopied, setShareCopied] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [code, setCode] = useState('');
  const [foundRoom, setFoundRoom] = useState<AcquireRoom>();
  const [error, setError] = useState('');
  const [priceTier, setPriceTier] = useState<number>();
  const [pending, setPending] = useState(false);
  const requestID = useRef(0);
  const busy = useRef(false);
  useEffect(() => () => { ++requestID.current; }, []);
  const playerID = profile2BackendName(profile.data);
  const onEnter = (room: AcquireRoom) => {
    if (roomEntry(room, playerID).allowed) navigate(`/game/acquire/match?roomID=${encodeURIComponent(room.roomID)}`);
  };
  const create = async () => {
    if (busy.current) return;
    busy.current = true;
    const id = ++requestID.current;
    setPending(true); setError('');
    try {
      const room = await createAcquireRoom(visibility);
      if (id === requestID.current) navigate(`/game/acquire/match?roomID=${encodeURIComponent(room.roomID)}`);
    } catch (reason) {
      if (id === requestID.current) setError(reason instanceof Error ? reason.message : '创建失败，请重试');
    } finally {
      if (id === requestID.current) { busy.current = false; setPending(false); }
    }
  };
  const find = async () => {
    if (busy.current || !code.trim()) return;
    busy.current = true;
    const id = ++requestID.current;
    setPending(true); setError(''); setFoundRoom(undefined); setPanel('join');
    try {
      const room = await lookupRoom(code.trim());
      if (id === requestID.current) setFoundRoom(room);
    } catch (reason) {
      if (id === requestID.current) setError(reason instanceof Error ? reason.message : '查找失败，请重试');
    } finally {
      if (id === requestID.current) { busy.current = false; setPending(false); }
    }
  };
  const copyShareURL = async () => {
    try {
      await navigator.clipboard.writeText(ACQUIRE_PUBLIC_URL);
      setShareCopied(true);
    } catch {
      setShareCopied(false);
    }
  };
  const close = () => {
    if (busy.current) return;
    setPanel(undefined);
    setShareCopied(false);
  };
  const props = {
    lobby, profile: profile.data, stats: stats.data, statsError: stats.error, playerID, code, setCode,
    onCreate: () => { setError(''); setPanel('create'); }, onShare: () => { setShareCopied(false); setPanel('share'); },
    onCompany: (company: keyof typeof companyPriceTiers) => setPriceTier(companyPriceTiers[company]), onJoin: find, onEnter,
  };
  const initialLoading = !lobby.hasLoaded && !lobby.error || profile.loading && !profile.data;
  return <AppShell title="游戏大厅" profile={profile.data}>
    {profile.error && <Feedback error>{profile.error}<ActionButton onClick={profile.retry}>重试资料</ActionButton></Feedback>}
    {initialLoading ? <AcquireLoading status="正在连接在线大厅" /> : isMobile ? <LobbyMobile {...props} /> : <LobbyDesktop {...props} />}
    {!initialLoading && <footer className={styles.pageFooter}><span>{lobby.rooms.length} 个可见房间</span><span>一张桌，一座城，一段好时光。</span></footer>}
    {panel === 'create' && <ResponsiveDialog title="创建房间" eyebrow="CREATE YOUR NEXT TABLE" className={styles.createDialog} onClose={close}
      footer={<><ActionButton onClick={close} disabled={pending}>取消</ActionButton><ActionButton variant="primary" type="submit" form="acquire-create-room" pending={pending} disabled={!profile.data}>创建并入座<ArrowRight size={16} /></ActionButton></>}>
      <form id="acquire-create-room" className={styles.createForm} onSubmit={event => { event.preventDefault(); void create(); }}>
        <p className={styles.createDescription}>选择公开范围，房间号将在创建后自动分配。</p>
        <div className={styles.visibilityLabel} id="acquire-visibility-label">房间公开范围</div>
        <div className={styles.visibility} role="group" aria-labelledby="acquire-visibility-label">
        {(['public', 'private'] as const).map(value => <button type="button" key={value} aria-pressed={visibility === value}
          disabled={pending} className={visibility === value ? styles.chosen : ''} onClick={() => setVisibility(value)}>
          {value === 'public' ? <Globe size={23} /> : <Lock size={23} />}
          <strong>{value === 'public' ? '公开房间' : '私密房间'}</strong>
          <small>{value === 'public' ? '显示在大厅，其他玩家可加入' : '仅你可在大厅看到，其他玩家通过房间号加入'}</small>
          {visibility === value && <Check className={styles.visibilityCheck} size={14} />}
        </button>)}
        </div><div className={styles.createHint}><ShieldCheck size={16} /><span>{visibility === 'public' ? '公开房间可从大厅列表或通过房间号加入。' : '仅你会在大厅看到这张桌；朋友仍需使用完整房间号。'}</span></div>
        {error && <Feedback error>{error}</Feedback>}
      </form>
    </ResponsiveDialog>}
    {panel === 'join' && <ResponsiveDialog title="通过房间号加入" eyebrow="FIND YOUR FRIENDS' TABLE" onClose={close}
      footer={<><ActionButton onClick={close} disabled={pending}>取消</ActionButton><ActionButton variant="primary" type={foundRoom ? 'button' : 'submit'} form={foundRoom ? undefined : 'acquire-join-room'}
        pending={pending} disabled={!code.trim() || !!foundRoom && !roomEntry(foundRoom, playerID).allowed}
        onClick={() => { if (foundRoom) onEnter(foundRoom); }}>{foundRoom ? roomEntry(foundRoom, playerID).label : '加入房间'}<ArrowRight size={16} /></ActionButton></>}>
      <form id="acquire-join-room" className={styles.joinForm} onSubmit={event => { event.preventDefault(); void find(); }}>
        <div className={styles.modalEmblem}><KeyRound size={29} /></div>
        <label>房间号<input aria-label="房间号" placeholder="例如 0302_075034" value={code} disabled={pending} onChange={event => { setCode(event.target.value); setFoundRoom(undefined); }} autoCapitalize="off" spellCheck={false} /></label>
      </form>
      {error && <Feedback error>{error}</Feedback>}
      <div className={styles.joinHint}><ShieldCheck size={16} /><span>输入朋友分享的完整房间号。</span></div>
      {foundRoom && <RoomCard room={foundRoom} playerID={playerID} onEnter={onEnter} />}
    </ResponsiveDialog>}
    {panel === 'share' && <ResponsiveDialog title="分享 Acquire" eyebrow="INVITE SOMEONE TO THE TABLE" className={styles.shareDialog} onClose={close}
      footer={<><ActionButton onClick={close}>关闭</ActionButton><ActionButton variant="primary" onClick={() => void copyShareURL()}>
        {shareCopied ? <Check size={16} /> : <Copy size={16} />}{shareCopied ? '链接已复制' : '复制游戏链接'}
      </ActionButton></>}>
      <div className={styles.shareContent}>
        <div className={styles.shareQRCode}><QRCode type="svg" value={ACQUIRE_PUBLIC_URL} size={184} bordered={false}
          color="#172c35" bgColor="#f0e7cf" errorLevel="M" /></div>
        <div className={styles.shareAddress}><span>游戏地址</span><strong>{ACQUIRE_PUBLIC_URL}</strong></div>
        <p className={styles.shareHint}><QrCode size={16} />朋友可以扫码进入大厅，也可以使用复制的链接直接打开。</p>
      </div>
    </ResponsiveDialog>}
    {priceTier != null && <StockPrices initialTier={priceTier} onClose={() => setPriceTier(undefined)} />}
  </AppShell>;
}
