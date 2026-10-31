import {
  ArrowLeft,
  Check,
} from 'lucide-react';
import {
  GameFinalResult,
  GameFinalResultActions,
} from '@/components/GameUI/GameFinalResult';
import {
  Eyebrow,
  Portrait,
  Scene,
  roleName,
} from '../../components/Visual';
import { selfRole } from '../../model/selectors';
import {
  playerLabel,
  type GameSnapshot,
} from '../../model/session';
import type { Role } from '../../model/types';

const reasonText = (reason: string, winnerRole: Role) => {
  switch (reason) {
    case 'all_hideouts_revealed':
      return '所有暗置藏身点均已揭晓，追捕者完成抓获。';
    case 'escaped':
      return '最高公开地点已达到直接逃脱条件，逃亡者成功抵达 42。';
    case 'manhunt_missed':
      return '最终追缉出现一次错误，逃亡者成功消失在城市尽头。';
    case 'manhunt_caught':
      return '最终追缉连续命中全部地点，追捕者完成抓获。';
    default:
      return winnerRole === 'fugitive'
        ? '逃亡者成功抵达城市尽头。'
        : '追捕者找到了完整的逃亡路线。';
  }
};

export function Results({
  data,
  roomName,
  onExit,
  onReview,
  onRematch,
  rematchPending,
}: {
  data: GameSnapshot;
  roomName: string;
  onExit: () => void;
  onReview: () => void;
  onRematch: () => void;
  rematchPending: boolean;
}) {
  const result = data.result;
  if (!result) return null;
  const role = selfRole(data);
  const won = role === result.winnerRole;
  const players = data.roomData.players;
  const names = Object.fromEntries((['fugitive', 'marshal'] as const).map(item => {
    const id = Object.keys(data.playerData).find(playerID =>
      data.playerData[playerID]?.role === item) ?? '';
    return [item, playerLabel(id, players)];
  })) as Record<Role, string>;
  const routeCount = Math.max(0, data.roomData.route.length - 1);
  const revealedCount = data.roomData.route.filter(item =>
    item.revealed && item.card?.number !== 0).length;

  return <div className="game-app result-app">
    <div className="topbar" data-game-result-topbar>
      <header className="game-header result-topbar">
        <button className="icon-button" type="button" aria-label="返回大厅"
          onClick={onExit}><ArrowLeft size={20} /></button>
        <div className="game-room"><b>对局结算</b>
          <small>{roomName} · 线上对局</small></div>
        <span className="pill">已完成</span>
      </header>
    </div>
    <GameFinalResult
      className="result-page"
      mobileInset="self"
      heroClassName="result-hero"
      standingsClassName="result-summary result-standings"
      summaryClassName="result-summary result-detail"
      actionsClassName="result-dock"
      hero={<><div className="result-art"><Scene index={result.winnerRole === 'fugitive' ? 5 : 3} />
        <span className="result-stamp">{result.winnerRole === 'fugitive'
          ? 'ESCAPED' : 'CASE CLOSED'}</span></div>
      <div className="result-title">
        <Eyebrow>{won ? 'A NIGHT TO REMEMBER' : 'UNTIL THE NEXT CHASE'}</Eyebrow>
        <h1>{result.winnerRole === 'fugitive'
          ? '消失在城市尽头。' : '这场追逐，到此为止。'}</h1>
        <p>{won ? '你赢了' : '本局未能获胜'} · {names[result.winnerRole]}
          {result.winnerRole === 'fugitive' ? '逃亡成功' : '追捕成功'}</p>
      </div></>}
      standings={<><div className="section-heading"><h2>这一局的追逐</h2>
          <span className="pill">第 {data.roomData.roundNo} 回合</span></div>
        <div className="result-player-list">
          {(['fugitive', 'marshal'] as const).map(item =>
            <div key={item} className={item === result.winnerRole ? 'result-winner' : ''}>
              <Portrait role={item} className="avatar" /><span>
                <b>{names[item]}{item === role && <em>你</em>}</b>
                <small>{roleName(item)}</small></span>
              <strong>{item === result.winnerRole
                ? <><Check size={14} />获胜</>
                : item === 'fugitive' ? '未能逃脱' : '未能抓获'}</strong>
            </div>)}
        </div>
      </>}
      summary={<><span className="eyebrow">THE CHASE IN NUMBERS</span>
        <div className="result-stats">
          <div><b>{routeCount}</b><span>途经地点</span></div>
          <div><b>{revealedCount}</b><span>已公开地点</span></div>
          <div><b>{result.searches}</b><span>搜查次数</span></div>
        </div>
        <p className="result-explanation">{reasonText(result.reason, result.winnerRole)}</p>
      </>}
      actions={<GameFinalResultActions mode="live"
        onViewBoard={onReview} viewBoardLabel="查看终局牌桌"
        onLeave={onExit} canRestart={data.ownerID === data.playerId}
        onRestart={onRematch} restartPending={rematchPending} />}
      footerNote="续局保留房间设置，房主可重新选择双方身份。"
      footerNoteClassName="result-note"
    />
  </div>;
}
