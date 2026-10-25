import { Route } from 'lucide-react';
import { AppShell } from '../AppShell';

function LoadingContent({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return <main className="page-content">
    <div className="empty-state" role="status" aria-label={description}>
      <Route size={34} /><span className="eyebrow">FOLLOWING THE TRAIL</span>
      <h1>{title}</h1><p>{description}</p>
    </div>
  </main>;
}

export function FugitiveLoading({
  fullScreen = false,
  title = '正在铺开逃亡路线。',
  description = '同步房间与最新对局状态',
}: {
  fullScreen?: boolean;
  title?: string;
  description?: string;
}) {
  return fullScreen
    ? <AppShell title="载入中"><LoadingContent title={title} description={description} /></AppShell>
    : <LoadingContent title={title} description={description} />;
}
