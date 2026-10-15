import { Building2, Check, Flag, ShieldCheck, UsersRound } from 'lucide-react';
import { ActionButton } from '../../components/ActionButton';
import { CompanyGlyph } from '../../components/CompanyGlyph';
import { ResponsiveDialog } from '../../components/ResponsiveDialog';
import { endGameState, type GameSnapshot } from '../../model/session';
import { companyKeys, type Company } from '../../model/types';
import styles from './index.module.less';

interface Props {
  data: GameSnapshot;
  enabled: boolean;
  pending: boolean;
  onClose: () => void;
  onVote: (allow: boolean) => boolean;
}

export function EndGameDialog({ data, enabled, pending, onClose, onVote }: Props) {
  const endGame = endGameState(data);
  const players = Object.values(data.roomData.players);
  const humans = players.filter(player => !player.ai);
  const approved = humans.filter(player => endGame.votes[player.playerID]).length;
  const aiCount = players.length - humans.length;
  const company = companyKeys.find(key => key === endGame.company) as Company | undefined;
  const vote = (allow: boolean) => {
    if (onVote(allow)) onClose();
  };

  return <ResponsiveDialog title="这座城，准备好落定了吗？" eyebrow="DECLARE THE END OF THE GAME"
    onClose={onClose} className={styles.dialog}
    footer={<><ActionButton disabled={!enabled} pending={pending} onClick={() => vote(false)}>继续对局</ActionButton>
      <ActionButton variant="primary" disabled={!enabled} pending={pending} onClick={() => vote(true)}>
        允许结束<Flag size={16} />
      </ActionButton></>}>
    <div className={styles.condition}>
      <span className={styles.conditionIcon}>
        {company ? <CompanyGlyph company={company} size={43} /> : <Building2 size={35} />}
      </span>
      <div>
        {endGame.condition === 'company_size' && company
          ? <><b>{company}</b><strong>{endGame.tileCount}<small> 块地</small></strong>
            <span><Check size={14} />已达到 41 块地的终局条件</span></>
          : <><b>所有已成立公司</b><strong>安全<small> 状态</small></strong>
            <span><Check size={14} />均已达到至少 11 块地</span></>}
      </div>
    </div>

    <div className={styles.progress}>
      <UsersRound size={18} />
      <span><b>{approved} / {humans.length}</b> 位真人玩家已允许结束
        {aiCount > 0 && <small>{aiCount} 位人机已默认同意</small>}</span>
    </div>

    <div className={styles.steps}>
      <span><i>1</i>结算股东奖励</span>
      <span><i>2</i>按终局价格变现股票</span>
      <span><i>3</i>现金与股票汇总排名</span>
    </div>

    <p className={styles.hint}><ShieldCheck size={16} />
      <span>全部真人玩家同意后，将在当前玩家完整结束本回合时结算。若未全员同意，对局会继续到棋盘全部铺满。</span>
    </p>
  </ResponsiveDialog>;
}
