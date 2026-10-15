import { AppShell } from '../../components/AppShell';
import { AcquireLoading } from '../../components/LoadingState';

export function AcquireSessionLoading() {
  return <AppShell inMatch hideRail title="经典对局">
    <AcquireLoading title="正在进入这张桌。" description="正在同步玩家席位与最新对局状态" status="正在建立实时连接" />
  </AppShell>;
}
