import { UserProfile } from '@/hooks/request/useProfile';
import styles from './index.module.less'
import { Dropdown, Modal } from 'antd';
import { ArrowLeftOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Button } from '../../../../components/Button';
import { useNavigate } from 'react-router-dom';
import { ListRoomInfo } from '@/types/room';

export interface IHeaderProps {
  userProfile: UserProfile
  runLogout: () => void
  handleCreateRoom: () => void
  roomList?: ListRoomInfo[]
}

export const Header = ({
  userProfile,
  runLogout,
  handleCreateRoom,
  roomList,
}: IHeaderProps) => {
  const navigate = useNavigate();
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <Button content="" icon={<ArrowLeftOutlined />} onClick={() => {
          Modal.confirm({
            title: '确认操作',
            content: '你确定要返回大厅吗？',
            okText: '确认',
            cancelText: '取消',
            onOk: () => {
              navigate('/');
            },
          });
        }} />
        <div className={styles.content}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Acquire 游戏大厅</h1>
          </div>
        </div>
      </div>
      <div className={styles.right}>
        {Number(roomList?.length) > 0 ? <Button customType="primary" content="创建房间" icon={<PlusCircleOutlined />} onClick={() => {
          handleCreateRoom();
        }}/> : null}
        <Dropdown
          menu={{
            items: [
              {
                key: 'profile',
                label: (
                  <a href="https://auth.gamebus.online/profile" target="_blank" rel="noopener noreferrer">
                    Profile
                  </a>
                ),
              },
              {
                key: 'logout',
                label: (
                  <span onClick={() => {
                    Modal.confirm({
                      title: '确定要退出登录吗？',
                      cancelText: '取消',
                      onOk: runLogout,
                    });
                  }}>
                    退出登录
                  </span>
                ),
              },
            ],
          }}
          trigger={['hover']}
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
    </div>
  )
}