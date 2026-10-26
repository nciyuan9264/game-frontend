import { AppShell } from '../../components/AppShell';
import { OthelloLoading } from '../../components/LoadingState';

export function OthelloSessionLoading() {
  return <AppShell inMatch title="连接棋室">
    <OthelloLoading
      title="正在进入棋室。"
      description="正在同步身份、席位与最新对局状态"
    />
  </AppShell>;
}
