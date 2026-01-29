import { useRequest } from 'ahooks';
import { message } from 'antd';
import { logout } from '@/api/room';

export const useLogout = () => {
  const { data, loading, run, error } = useRequest<[],[]>(
    async () => {
      try {
        return await logout();
      } catch (e) {
        console.error('退出登录失败:', e);
        throw e;
      }
    },
    {
      manual: true,
      onSuccess: () => {
        message.success('退出登录成功！');
        setTimeout(() => {
          window.location.href = 'https://auth.gamebus.online?redirect=https://board.gamebus.online';
        }, 3000);
      },
      onError: error => {
        message.error(`退出登录失败: ${error.message || '未知错误'}`);
      },
    }
  );

  return {
    data,
    loading,
    error,
    runLogout: run,
  };
};
