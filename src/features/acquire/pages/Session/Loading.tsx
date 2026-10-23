import { useEffect, useRef } from 'react';
import { AppShell } from '../../components/AppShell';
import { AcquireLoading } from '../../components/LoadingState';

export function AcquireSessionLoading() {
  const mountID = useRef(crypto.randomUUID());
  useEffect(() => {
    const debugMountID = mountID.current;
    const root = document.querySelector<HTMLElement>('[role="status"]');
    const rect = root?.getBoundingClientRect();
    // #region debug-point B-C:loader-lifecycle
    void fetch('https://api.gamebus.online/__trae-debug/room-loading-jitter/event', { method: 'POST', body: JSON.stringify({ sessionId: 'room-loading-jitter', runId: 'pre-fix', hypothesisId: 'B,C', location: 'features/acquire/pages/Session/Loading', msg: '[DEBUG] Acquire session loader mounted', data: { mountID: debugMountID, width: rect?.width ?? -1, height: rect?.height ?? -1 }, ts: Date.now() }) }).catch(() => {});
    // #endregion
    return () => {
      // #region debug-point B:loader-unmount
      void fetch('https://api.gamebus.online/__trae-debug/room-loading-jitter/event', { method: 'POST', body: JSON.stringify({ sessionId: 'room-loading-jitter', runId: 'pre-fix', hypothesisId: 'B', location: 'features/acquire/pages/Session/Loading', msg: '[DEBUG] Acquire session loader unmounted', data: { mountID: debugMountID }, ts: Date.now() }) }).catch(() => {});
      // #endregion
    };
  }, []);
  return <AppShell inMatch hideRail title="经典对局">
    <AcquireLoading title="正在进入这张桌。" description="正在同步玩家席位与最新对局状态" status="正在建立实时连接" />
  </AppShell>;
}
