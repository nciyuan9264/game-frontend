import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProfile } from '@/hooks/request/useProfile';
import { profile2BackendName } from '@/util/user';
import { LoadingBlock } from '@/components/LoadingBlock';

import ReplayContent from './index';

const ReplayPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { userProfile, profileLoading, handleGetProfile } = useProfile();
  const viewerID = profile2BackendName(userProfile);

  useEffect(() => {
    handleGetProfile();
  }, []);

  const id = gameId ? Number(gameId) : NaN;

  if (profileLoading || !viewerID || Number.isNaN(id)) {
    return <LoadingBlock content="加载回放..." />;
  }

  return (
    <ReplayContent
      gameId={id}
      viewerID={viewerID}
      onExit={() => navigate(-1)}
    />
  );
};

export default ReplayPage;
