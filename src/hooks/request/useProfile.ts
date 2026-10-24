import { useRequest } from 'ahooks';
import { message } from 'antd';
import { useState } from 'react';
import { getProfile } from '@/features/game-core/api/auth';

export interface UserProfile {
  name: string;
  displayName: string;
  email: string;
  avatar?: string;
  id: string;
}
export const useProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    displayName: '',
    email: '',
    avatar: '',
    id: '',
  });

  const { run: handleGetProfile, loading: profileLoading } = useRequest(
    async () => {
      const profile = localStorage.getItem('profile');
      if (profile) {
        const cached = JSON.parse(profile) as Partial<UserProfile>;
        return {
          name: cached.displayName ?? cached.name ?? '',
          displayName: cached.displayName ?? cached.name ?? '',
          email: cached.email ?? '',
          avatar: cached.avatar ?? '',
          id: cached.id ?? '',
        };
      }
      return await getProfile();
    },
    {
      onError: () => {
        message.error('获取用户信息失败，请重试');
      },
      onSuccess: profile => {
        setUserProfile(profile);
      },
    }
  );

  return {
    userProfile,
    profileLoading,
    handleGetProfile,
  };
};
