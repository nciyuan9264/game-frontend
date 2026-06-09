import React, { useEffect, useMemo, useState } from 'react';
import { LoadingBlock } from '@/components/LoadingBlock';
import { useGameDetail, useSnapshots } from '@/hooks/request/useHistory';
import { Board } from '@/view/Acquire/components/Game/components/Board';
import CompanyInfo from '@/view/Acquire/components/Game/components/CompanyInfo';
import PlayerAssets from '@/view/Acquire/components/Game/components/PlayerAssets';
import type { GameID, EventMeta } from '@/types/history';
import { snapshotToWsRoomSyncData } from './snapshotAdapter';

import gameStyles from '@/view/Acquire/components/Game/index.module.less';
import styles from './index.module.less';

import ReplayTopBar from './components/ReplayTopBar';
import ReplayTimeline from './components/ReplayTimeline';
import ScoreModal from './components/ScoreModal';

interface ReplayContentProps {
  gameId: GameID;
  viewerID: string;
  onExit: () => void;
}

const noop = () => {};
const noopSet: React.Dispatch<React.SetStateAction<boolean>> = () => {};

const ReplayContent: React.FC<ReplayContentProps> = ({
  gameId,
  viewerID,
  onExit,
}) => {
  const { detail, runGetGameDetail, detailLoading } = useGameDetail();
  const { snapshots, runGetSnapshots, snapshotsLoading } = useSnapshots();
  const [step, setStep] = useState<number>(-1);
  const [scoreVisible, setScoreVisible] = useState(false);

  useEffect(() => {
    if (gameId !== undefined) {
      setStep(-1);
      runGetGameDetail(gameId, 'acquire');
      runGetSnapshots(gameId, 'acquire');
    }
  }, [gameId]);

  const events: EventMeta[] = detail?.events ?? [];
  const totalEvents = events.length;

  const snapshotMap = useMemo(
    () => new Map((snapshots ?? []).map((s) => [s.seq, s])),
    [snapshots]
  );

  const snapshot = snapshotMap.get(step);

  const fakeRoomData = useMemo(() => {
    if (!snapshot) return undefined;
    return snapshotToWsRoomSyncData(snapshot, viewerID);
  }, [snapshot, viewerID]);

  return (
    <div className={styles.replayRoot}>
      <div className={gameStyles['game-container']}>
        <ReplayTopBar
          game={detail?.game}
          viewerID={viewerID}
          step={step}
          total={totalEvents}
          onExit={onExit}
          onShowScore={() => setScoreVisible(true)}
        />
        <div className={gameStyles.gameBoard}>
          <Board
            readonly
            tilesData={fakeRoomData?.roomData.tiles}
            hoveredTile={undefined}
            setHoveredTile={noop}
            wsRoomSyncData={fakeRoomData}
            placeTile={noop}
          />
          <CompanyInfo
            data={fakeRoomData}
            userID={viewerID}
            setBuyStockModalVisible={noopSet}
            setMergeCompanyModalVisible={noopSet}
          />
        </div>
        <div className={gameStyles.assets}>
          <PlayerAssets
            data={fakeRoomData}
            sendMessage={noop}
            setHoveredTile={noop}
            placeTile={noop}
            userID={viewerID}
          />
        </div>
      </div>

      <ReplayTimeline
        events={events}
        step={step}
        setStep={setStep}
        loading={snapshotsLoading}
        snapshots={snapshots ?? []}
        players={detail?.players}
      />

      {detailLoading && !detail && (
        <div className={styles.loadingWrap}>
          <LoadingBlock content="加载对局详情..." />
        </div>
      )}

      {!!detail && snapshotsLoading && (
        <div className={styles.snapshotLoading}>
          <LoadingBlock content="加载快照..." />
        </div>
      )}

      <ScoreModal
        visible={scoreVisible}
        result={snapshot?.result}
        onClose={() => setScoreVisible(false)}
      />
    </div>
  );
};

export default ReplayContent;
