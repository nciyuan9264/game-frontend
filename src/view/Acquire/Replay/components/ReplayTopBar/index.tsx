import React from 'react';
import { ArrowLeftOutlined, HomeOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { backendName2FrontendName } from '@/util/user';
import type { Game } from '@/types/history';
import topBarStyles from '@/view/Acquire/components/Game/components/TopBar/index.module.less';
import styles from './index.module.less';

interface ReplayTopBarProps {
  game?: Game;
  viewerID: string;
  step: number;
  total: number;
  onExit: () => void;
  onShowScore: () => void;
}

const ReplayTopBar: React.FC<ReplayTopBarProps> = ({
  game,
  viewerID,
  step,
  total,
  onExit,
  onShowScore,
}) => {
  return (
    <div className={topBarStyles['top-bar']}>
      <div className={topBarStyles['top-bar__header']}>
        <div className={topBarStyles['top-bar__left']}>
          <Button icon={<ArrowLeftOutlined />} onClick={onExit} />
          <div className={topBarStyles['top-bar__brand']}>
            <div className={topBarStyles['top-bar__title']}>Acquire 对局回放</div>
          </div>
        </div>
        <div className={topBarStyles['top-bar__status']}>
          <Button
            content={`回放中 ${step + 1} / ${total}`}
            customType="primary"
            style={{ minWidth: '12rem', height: '2rem', fontSize: '1.2rem' }}
          />
        </div>
        <div className={topBarStyles['top-bar__right']}>
          <span className={styles.backMobileOnly}>
            <Button icon={<ArrowLeftOutlined />} onClick={onExit} />
          </span>
          <span className={styles.scoreBtn}>
            <Button
              icon={<TrophyOutlined />}
              content="当前得分"
              onClick={onShowScore}
            />
          </span>
        </div>
      </div>
      <div className={topBarStyles['top-bar__footer']}>
        <div>
          <HomeOutlined /> 房间 {game?.roomID ?? '-'}{' '}
          <UserOutlined /> 玩家 {backendName2FrontendName(viewerID)}
        </div>
      </div>
    </div>
  );
};

export default ReplayTopBar;
