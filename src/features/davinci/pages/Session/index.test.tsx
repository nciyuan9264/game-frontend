import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DavinciSessionPage from './index';

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  lookupGameRoom: vi.fn(),
  useDavinciSession: vi.fn(),
}));

vi.mock('@/features/game-core/api/auth', () => ({ getProfile: mocks.getProfile }));
vi.mock('@/features/game-core/api/room', () => ({ lookupGameRoom: mocks.lookupGameRoom }));
vi.mock('../../hooks/useDavinciSession', () => ({ useDavinciSession: mocks.useDavinciSession }));
vi.mock('../../hooks/useDavinciLeave', () => ({
  useDavinciLeave: vi.fn(() => ({
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
  mocks.useDavinciSession.mockReset();
  mocks.lookupGameRoom.mockResolvedValue({ currentMatchID: 'match-1' });
  mocks.useDavinciSession.mockReturnValue({
    snapshot: undefined,
    pending: undefined,
    feedback: '',
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

describe('Davinci session bootstrap', () => {
  it('keeps one loader mounted while the match target resolves', async () => {
    let resolveProfile: (profile: { id: string; name: string; email: string }) => void = () => {};
    mocks.getProfile.mockReturnValue(new Promise(resolve => { resolveProfile = resolve; }));

    render(<MemoryRouter initialEntries={['/game/davinci/match?roomID=room-1']}>
      <DavinciSessionPage />
    </MemoryRouter>);

    const loader = screen.getByRole('status');
    expect(mocks.useDavinciSession).toHaveBeenCalledWith(
      'room-1', '', expect.any(Function),
    );

    await act(async () => {
      resolveProfile({ id: '42', name: 'Alice', email: 'alice@example.com' });
    });

    await waitFor(() => expect(mocks.useDavinciSession).toHaveBeenCalledWith(
      'room-1', 'match-1', expect.any(Function),
    ));
    expect(screen.getByRole('status')).toBe(loader);
  });
});
