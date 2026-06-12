import { useState } from 'react';
import { UserProfile } from '@/hooks/request/useProfile';
import styles from './index.module.less'
import { Dropdown } from 'antd';
import { PlusCircleOutlined, UserOutlined, LogoutOutlined, HistoryOutlined, TrophyOutlined } from '@ant-design/icons';
import { Button } from '../../../../components/Button';
import { ListRoomInfo } from '@/types/room';
import ProfileModal from '../ProfileModal';
import LeaderboardModal from '@/components/Leaderboard';
import { profile2BackendName } from '@/util/user';
import { GameType } from '@/hooks/useGameType';
import type { HistoryGameType } from '@/types/history';
import { useInteractionMode } from '@/hooks/useInteractionMode';
import { useConfirmDialog } from '@/components/ConfirmDialog/useConfirmDialog';

export interface IHeaderProps {
  userProfile: UserProfile
  runLogout: () => void
  handleCreateRoom: () => void
  roomList?: ListRoomInfo[]
  gameType: GameType
}

export const Header = ({
  userProfile,
  runLogout,
  handleCreateRoom,
  roomList,
  gameType,
}: IHeaderProps) => {
  const [profileVisible, setProfileVisible] = useState(false);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const viewerID = profile2BackendName(userProfile);
  const lobbyTitleMap: Record<GameType, string> = {
    acquire: 'Acquire 游戏大厅',
    davinci: '达芬奇密码 游戏大厅',
    splendor: '璀璨宝石 游戏大厅',
  };
  // Splendor 暂无历史战绩，回退到 acquire
  const historyGameTypeMap: Record<GameType, HistoryGameType> = {
    acquire: 'acquire',
    davinci: 'davinci',
    splendor: 'acquire',
  };
  const lobbyTitle = lobbyTitleMap[gameType];
  const historyGameType: HistoryGameType = historyGameTypeMap[gameType];
  const { dropdownTrigger } = useInteractionMode();
  const { confirm, ConfirmDialogHolder } = useConfirmDialog();

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <div className={styles.content}>
          <div className={styles.titleRow}>
            {lobbyTitle}
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <Button
          customType="primary"
          style={{ height: '2rem' }}
          content="排行榜"
          icon={<TrophyOutlined />}
          onClick={() => setLeaderboardVisible(true)}
        />
        {Number(roomList?.length) > 0 ? <Button customType="primary" style={{height: '2rem'}} content="创建房间" icon={<PlusCircleOutlined />} onClick={() => {
          handleCreateRoom();
        }}/> : null}
        <Dropdown
          menu={{
            onClick: async ({ key, domEvent }) => {
              if (key === 'history') {
                setProfileVisible(true);
              } else if (key === 'profile') {
                domEvent.preventDefault();
                window.open(
                  'https://auth.gamebus.online/profile',
                  '_blank',
                  'noopener,noreferrer'
                );
              } else if (key === 'logout') {
                const ok = await confirm({
                  title: '确定要退出登录吗？',
                  cancelText: '取消',
                  okText: '确认',
                  danger: true,
                });
                if (ok) {
                  runLogout();
                }
              }
            },
            items: [
              {
                key: 'history',
                icon: <HistoryOutlined />,
                label: '个人主页',
              },
              {
                key: 'profile',
                icon: <UserOutlined />,
                label: 'Profile',
              },
              {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: '退出登录',
              },
            ],
          }}
          trigger={dropdownTrigger}
        >
          <div className={styles['user-info']}>
            {userProfile?.avatar ? (
              <img
                className={styles['user-avatar']}
                src={userProfile.avatar}
                alt="user avatar"
                style={{ opacity: 1, transition: 'opacity 0.3s ease-in-out' }}
              />
            ) : (
              <div className={styles['avatar-skeleton']} />
            )}
          </div>
        </Dropdown>
      </div>
      <ProfileModal
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        userID={viewerID}
        gameType={historyGameType}
      />
      <LeaderboardModal
        visible={leaderboardVisible}
        onClose={() => setLeaderboardVisible(false)}
        gameType={historyGameType}
      />
      {ConfirmDialogHolder}
    </div>
  )
}
