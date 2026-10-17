import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AcquireSessionPage from './index';
import { SessionExitState } from './ExitState';

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  useAcquireSession: vi.fn(),
}));

vi.mock('@/api/room', () => ({ getProfile: mocks.getProfile }));
vi.mock('../../hooks/useAcquireSession', () => ({ useAcquireSession: mocks.useAcquireSession }));
vi.mock('../../hooks/useAcquireInteraction', () => ({ useAcquireInteraction: vi.fn(() => ({})) }));
vi.mock('../../hooks/useAcquireLeave', () => ({
  useAcquireLeave: vi.fn(() => ({
    visible: false,
    request: vi.fn(),
    cancel: vi.fn(),
    confirm: vi.fn(),
  })),
}));

beforeEach(() => {
  mocks.getProfile.mockReset();
  mocks.useAcquireSession.mockReset();
  mocks.useAcquireSession.mockReturnValue({
    snapshot: undefined,
    pending: undefined,
    feedback: '',
    activity: [],
    connection: {
      status: 'disconnected',
      attempt: 0,
      fatal: '',
      close: vi.fn(),
      retry: vi.fn(),
    },
    submit: vi.fn(),
    setFeedback: vi.fn(),
  });
});
afterEach(cleanup);

describe('Acquire session exit state', () => {
  it('separates the failure reason from the lobby action', () => {
    const onLeave = vi.fn();
    render(<SessionExitState title="无法进入当前对局" message="此身份已在其他窗口连接，请先退出" onLeave={onLeave} />);

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('此身份已在其他窗口连接，请先退出');
    fireEvent.click(screen.getByRole('button', { name: '返回大厅' }));
    expect(onLeave).toHaveBeenCalledTimes(1);
  });
});

describe('Acquire session authentication preflight', () => {
  it('does not create the session connection before profile verification succeeds', async () => {
    let resolveProfile: (profile: { id: string; name: string; email: string }) => void = () => {};
    mocks.getProfile.mockReturnValue(new Promise(resolve => { resolveProfile = resolve; }));

    render(<MemoryRouter initialEntries={['/game/acquire/match?roomID=room-1']}>
      <AcquireSessionPage />
    </MemoryRouter>);

    expect(mocks.getProfile).toHaveBeenCalledTimes(1);
    expect(mocks.useAcquireSession).not.toHaveBeenCalled();

    await act(async () => {
      resolveProfile({ id: '42', name: 'Alice', email: 'alice@example.com' });
    });

    await waitFor(() => expect(mocks.useAcquireSession).toHaveBeenCalledWith('room-1'));
  });

  it('keeps the session closed after verification failure and supports retrying', async () => {
    mocks.getProfile.mockRejectedValueOnce(new Error('认证服务暂时不可用'));

    render(<MemoryRouter initialEntries={['/game/acquire/match?roomID=room-2']}>
      <AcquireSessionPage />
    </MemoryRouter>);

    expect(await screen.findByText('登录状态确认失败')).toBeTruthy();
    expect(mocks.useAcquireSession).not.toHaveBeenCalled();

    mocks.getProfile.mockResolvedValue({ id: '42', name: 'Alice', email: 'alice@example.com' });
    fireEvent.click(screen.getByRole('button', { name: '重新验证' }));

    await waitFor(() => expect(mocks.useAcquireSession).toHaveBeenCalledWith('room-2'));
  });
});
