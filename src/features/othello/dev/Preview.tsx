import { useLayoutEffect, useMemo, useState } from 'react';
import { PanelsTopLeft } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import type { OthelloSession } from '../hooks/useOthelloSession';
import type {
  GameSnapshot,
  MatchSnapshot,
} from '../model/session';
import type { Disc, MoveEntry } from '../model/types';
import Lobby from '../pages/Lobby';
import { Guide, My, Rankings } from '../pages/Community';
import { Play } from '../pages/Play';
import { Room } from '../pages/Room';
import { installOthelloPreviewApi } from './previewApi';
import styles from './Preview.module.less';

const scenes = [
  ['lobby', '外层 · 对局大厅'],
  ['rankings', '外层 · 棋手排行'],
  ['guide', '外层 · 玩法指南'],
  ['profile', '外层 · 我的棋谱'],
  ['room-empty', '房间 · 空席位'],
  ['room-ready', '房间 · 双人准备'],
  ['room-ai', '房间 · 困难 AI'],
  ['play-turn', '对局 · 我的回合'],
  ['play-wait', '对局 · 等待对手'],
  ['play-pass', '对局 · 必须跳过'],
  ['result-win', '结算 · 获胜'],
  ['result-draw', '结算 · 平局'],
] as const;

type Scene = typeof scenes[number][0];

const players = {
  me: {
    playerID: 'me',
    displayName: '王小明',
    online: true,
    ai: false,
    ready: true,
    seatIndex: 0,
  },
  rival: {
    playerID: 'rival',
    displayName: '林间落子',
    online: true,
    ai: false,
    ready: true,
    seatIndex: 1,
  },
  ai_2: {
    playerID: 'ai_2',
    displayName: '墨白',
    online: true,
    ai: true,
    aiDifficulty: 'hard',
    ready: true,
    seatIndex: 1,
  },
};

function board(): Disc[] {
  const value: Disc[] = Array.from({ length: 64 }, () => '');
  const black = [18, 20, 25, 27, 28, 34, 35, 36, 42, 44];
  const white = [19, 26, 29, 33, 37, 43, 45, 46];
  black.forEach(index => {
    value[index] = 'black';
  });
  white.forEach(index => {
    value[index] = 'white';
  });
  return value;
}

const moveLog: MoveEntry[] = [
  { id: 1, kind: 'move', playerID: 'me', side: 'black', index: 19, flips: [27], automatic: false },
  { id: 2, kind: 'move', playerID: 'rival', side: 'white', index: 18, flips: [27], automatic: false },
  { id: 3, kind: 'move', playerID: 'me', side: 'black', index: 26, flips: [27], automatic: false },
  { id: 4, kind: 'move', playerID: 'rival', side: 'white', index: 20, flips: [28], automatic: false },
  { id: 5, kind: 'move', playerID: 'me', side: 'black', index: 37, flips: [36], automatic: false },
  { id: 6, kind: 'move', playerID: 'rival', side: 'white', index: 45, flips: [36], automatic: false },
];

function roomSnapshot(scene: Scene): MatchSnapshot {
  const withAI = scene === 'room-ai';
  const occupied = scene !== 'room-empty';
  const opponent = withAI ? players.ai_2 : players.rival;
  return {
    schemaVersion: 2,
    type: 'MATCH_SYNC',
    roomID: 'OTHELLO-7K2M',
    matchID: 'preview-match',
    seq: 1,
    phaseVersion: 1,
    turnNumber: 0,
    ownerID: 'me',
    playerID: 'me',
    visibility: 'private',
    status: 'match',
    maxPlayers: 2,
    playerOrder: occupied ? ['me', opponent.playerID] : ['me'],
    players: occupied
      ? { me: players.me, [opponent.playerID]: opponent }
      : { me: { ...players.me, ready: false } },
  };
}

function gameSnapshot(scene: Scene): GameSnapshot {
  const ended = scene === 'result-win' || scene === 'result-draw';
  const draw = scene === 'result-draw';
  const waiting = scene === 'play-wait';
  const pass = scene === 'play-pass';
  const currentPlayer = waiting ? 'ai_2' : 'me';
  const currentSide = waiting ? 'white' : 'black';
  const previewPlayers = {
    me: players.me,
    ai_2: players.ai_2,
  };
  const blackCount = ended ? draw ? 32 : 39 : 10;
  const whiteCount = ended ? draw ? 32 : 25 : 8;
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID: 'OTHELLO-7K2M',
    matchID: 'preview-match',
    seq: 7,
    phaseVersion: 7,
    turnNumber: 7,
    ownerID: 'me',
    visibility: 'private',
    playerId: 'me',
    playerData: {
      me: { side: 'black', discCount: blackCount },
      ai_2: { side: 'white', discCount: whiteCount },
    },
    hint: ended ? undefined : {
      remaining: 2,
      pending: false,
      index: scene === 'play-turn' ? 17 : undefined,
    },
    result: ended ? {
      winnerID: draw ? undefined : 'me',
      winnerSide: draw ? undefined : 'black',
      blackCount,
      whiteCount,
      draw,
      reason: '双方均无合法落点',
    } : undefined,
    roomData: {
      board: board(),
      currentPlayer,
      currentSide,
      blackPlayerID: 'me',
      whitePlayerID: 'ai_2',
      roundNo: 3,
      gameStatus: ended ? 'end' : pass ? 'pass' : 'playing',
      legalMoves: ended || pass || waiting
        ? []
        : [
            { index: 17, flips: [26], lines: [[26]] },
            { index: 21, flips: [28], lines: [[28]] },
            { index: 41, flips: [42], lines: [[42]] },
          ],
      moveLog,
      lastData: moveLog.at(-1),
      turnDeadline: ended
        ? undefined
        : new Date(Date.now() + 45_000).toISOString(),
      turnTimeoutMs: 60_000,
      players: previewPlayers,
      playerOrder: ['me', 'ai_2'],
      analysis: ended ? {
        requestID: 'preview-final',
        status: 'ready',
        blackWinRate: draw ? 0 : 1,
        drawRate: draw ? 1 : 0,
        whiteWinRate: 0,
        score: blackCount - whiteCount,
        exact: true,
        engineVersion: 'platform-result',
      } : {
        requestID: 'preview-analysis',
        status: 'ready',
        blackWinRate: 0.57,
        drawRate: 0.08,
        whiteWinRate: 0.35,
        score: 4,
        depth: 12,
        elapsedMs: 482,
        exact: false,
        engineVersion: 'edax-4.7',
      },
    },
  };
}

function isScene(value: string | null): value is Scene {
  return scenes.some(([scene]) => scene === value);
}

export default function OthelloPreview() {
  const [params, setParams] = useSearchParams();
  const [apiReady, setApiReady] = useState(false);
  const scene = isScene(params.get('scene'))
    ? params.get('scene') as Scene
    : 'lobby';
  const showControls = params.get('controls') !== '0';
  useLayoutEffect(() => {
    const restore = installOthelloPreviewApi();
    setApiReady(true);
    return restore;
  }, []);
  const session = useMemo(() => ({
    connection: {
      status: 'connected',
      attempt: 0,
      fatal: '',
      fatalCode: '',
      close: () => undefined,
      retry: () => undefined,
    },
    pending: undefined,
    feedback: '',
    submit: () => true,
  }) as unknown as OthelloSession, []);

  if (!apiReady) return null;

  const inRoom = scene.startsWith('room-');
  const inGame = scene.startsWith('play-') || scene.startsWith('result-');
  const data = inRoom
    ? roomSnapshot(scene)
    : inGame
      ? gameSnapshot(scene)
      : undefined;
  const sessionContent = inRoom
    ? <Room session={session} data={data as MatchSnapshot}
        onLeave={() => undefined} />
    : inGame
      ? <Play
          session={session}
          data={data as GameSnapshot}
          onLeave={() => undefined}
          onStartNextMatch={async () => true}
        />
      : undefined;
  const content = scene === 'lobby'
    ? <Lobby />
    : scene === 'rankings'
      ? <Rankings />
      : scene === 'guide'
        ? <Guide />
        : scene === 'profile'
          ? <My />
          : <AppShell
              inMatch
              hideHeader={!inRoom}
              profile={{ name: players.me.displayName }}
              title={inRoom
                ? '准备棋室'
                : scene.startsWith('result-')
                  ? '本局结算'
                  : 'OTHELLO 对局'}
            >
              {sessionContent}
            </AppShell>;

  return <>
    {showControls && <label className={styles.controls}>
      <PanelsTopLeft size={17} />
      <span>预览场景</span>
      <select
        aria-label="预览场景"
        value={scene}
        onChange={event => {
          const next = new URLSearchParams(params);
          next.set('scene', event.target.value);
          setParams(next, { replace: true });
        }}
      >
        {scenes.map(([value, label]) =>
          <option key={value} value={value}>{label}</option>)}
      </select>
    </label>}
    {content}
  </>;
}
