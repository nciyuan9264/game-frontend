import { useRequest } from 'ahooks';
import { getProfile } from '@/api/room';
import { message } from 'antd';
import { useState } from 'react';

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  id: string;
}
export const useProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    avatar: '',
    id: '',
  });

  const { run: handleGetProfile, loading: profileLoading } = useRequest(
    async () => {
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
