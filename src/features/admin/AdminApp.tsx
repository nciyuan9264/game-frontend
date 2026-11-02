import { useCallback } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getProfile } from '@/features/game-core/api/auth';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { AdminLayout } from './components/Layout';
import { ErrorState, LoadingState } from './components/ResourceState';
import Games from './pages/Games';
import Live from './pages/Live';
import Overview from './pages/Overview';
import UserDetail from './pages/UserDetail';
import Users from './pages/Users';
import styles from './index.module.less';

export default function AdminApp() {
  const loadProfile = useCallback(getProfile, []);
  const { data: profile, loading, error, retry } = useAsyncResource(loadProfile);

  if (loading && !profile) {
    return <div className={styles.fullPageState}><LoadingState /></div>;
  }
  if (!profile) {
    return <div className={styles.fullPageState}><ErrorState message={error} retry={retry} /></div>;
  }
  if (!profile.roles.some(role => role.toLowerCase() === 'admin')) {
    return (
      <div className={styles.deniedState}>
        <ShieldAlert size={38} />
        <h1>无权访问运营后台</h1>
        <a href="/">返回游戏广场</a>
      </div>
    );
  }

  return (
    <AdminLayout profile={profile}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:userID" element={<UserDetail />} />
        <Route path="games" element={<Games />} />
        <Route path="live" element={<Live />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
}
