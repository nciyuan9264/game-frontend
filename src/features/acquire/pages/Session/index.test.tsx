import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AcquireSessionPage from './index';
import { SessionExitState } from './ExitState';

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  lookupGameRoom: vi.fn(),
  useAcquireSession: vi.fn(),
}));

vi.mock('@/features/game-core/api/auth', () => ({ getProfile: mocks.getProfile }));
vi.mock('@/features/game-core/api/room', () => ({ lookupGameRoom: mocks.lookupGameRoom }));
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
vi.mock('../Room', () => ({ Room: () => <div>准备房间内容</div> }));
vi.mock('../Play', () => ({ Play: () => <div>对局内容</div> }));

beforeEach(() => {
  mocks.getProfile.mockReset();
  mocks.lookupGameRoom.mockReset();
  mocks.useAcquireSession.mockReset();
  mocks.lookupGameRoom.mockResolvedValue({ currentMatchID: 'match-1' });
  mocks.useAcquireSession.mockReturnValue({
    snapshot: undefined,
    pending: undefined,
    feedback: '',
    activity: [],
    connection: {
      status: 'connecting',
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
  it('keeps one loader mounted and passes an empty match id until verification succeeds', async () => {
    let resolveProfile: (profile: { id: string; name: string; email: string }) => void = () => {};
    mocks.getProfile.mockReturnValue(new Promise(resolve => { resolveProfile = resolve; }));

    render(<MemoryRouter initialEntries={['/game/acquire/match?roomID=room-1']}>
      <AcquireSessionPage />
    </MemoryRouter>);

    const loader = screen.getByRole('status');
    expect(mocks.getProfile).toHaveBeenCalledTimes(1);
    expect(mocks.useAcquireSession).toHaveBeenCalledWith('room-1', '');

    await act(async () => {
      resolveProfile({ id: '42', name: 'Alice', email: 'alice@example.com' });
    });

    await waitFor(() => expect(mocks.useAcquireSession).toHaveBeenCalledWith('room-1', 'match-1'));
    expect(screen.getByRole('status')).toBe(loader);
  });

  it('keeps the session closed after verification failure and supports retrying', async () => {
    mocks.getProfile.mockRejectedValueOnce(new Error('认证服务暂时不可用'));

    render(<MemoryRouter initialEntries={['/game/acquire/match?roomID=room-2']}>
      <AcquireSessionPage />
    </MemoryRouter>);

    expect(await screen.findByText('对局信息确认失败')).toBeTruthy();
    expect(mocks.useAcquireSession).toHaveBeenCalledWith('room-2', '');

    mocks.getProfile.mockResolvedValue({ id: '42', name: 'Alice', email: 'alice@example.com' });
    fireEvent.click(screen.getByRole('button', { name: '重新验证' }));

    await waitFor(() => expect(mocks.useAcquireSession).toHaveBeenCalledWith('room-2', 'match-1'));
  });

  it('resets the keyed bootstrap when the room id changes', async () => {
    mocks.getProfile.mockResolvedValue({ id: '42', name: 'Alice', email: 'alice@example.com' });
    mocks.lookupGameRoom.mockImplementation(async (_gameType: string, roomID: string) => ({
      currentMatchID: `${roomID}-match`,
    }));
    function Harness() {
      const navigate = useNavigate();
      return <><button onClick={() => navigate('/game/acquire/match?roomID=room-2')}>切换房间</button><AcquireSessionPage /></>;
    }

    render(<MemoryRouter initialEntries={['/game/acquire/match?roomID=room-1']}>
      <Harness />
    </MemoryRouter>);

    await waitFor(() => expect(mocks.useAcquireSession).toHaveBeenCalledWith('room-1', 'room-1-match'));
    fireEvent.click(screen.getByRole('button', { name: '切换房间' }));

    await waitFor(() => expect(mocks.useAcquireSession).toHaveBeenCalledWith('room-2', ''));
    await waitFor(() => expect(mocks.useAcquireSession).toHaveBeenCalledWith('room-2', 'room-2-match'));
    expect(mocks.getProfile).toHaveBeenCalledTimes(2);
  });

  it('replaces the loader with room content after the first snapshot', async () => {
    mocks.getProfile.mockResolvedValue({ id: '42', name: 'Alice', email: 'alice@example.com' });
    const view = render(<MemoryRouter initialEntries={['/game/acquire/match?roomID=room-1']}>
      <AcquireSessionPage />
    </MemoryRouter>);

    await waitFor(() => expect(mocks.useAcquireSession).toHaveBeenCalledWith('room-1', 'match-1'));
    expect(screen.getByRole('status')).toBeTruthy();

    mocks.useAcquireSession.mockReturnValue({
      snapshot: { type: 'MATCH_SYNC', playerID: 'me', players: {} },
      pending: undefined,
      feedback: '',
      activity: [],
      connection: {
        status: 'connected',
        attempt: 0,
        fatal: '',
        close: vi.fn(),
        retry: vi.fn(),
      },
      submit: vi.fn(),
      setFeedback: vi.fn(),
    });
    view.rerender(<MemoryRouter initialEntries={['/game/acquire/match?roomID=room-1']}>
      <AcquireSessionPage />
    </MemoryRouter>);

    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText('准备房间内容')).toBeTruthy();
  });
});
