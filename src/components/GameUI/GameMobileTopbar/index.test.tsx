import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameMobileReplayHeading, GameMobileTopbar } from '.';

afterEach(cleanup);

describe('GameMobileTopbar', () => {
  it('renders identity, status, actions, and the existing leave callback', () => {
    const onBack = vi.fn();
    const { container } = render(<GameMobileTopbar
      onBack={onBack}
      backLabel="离开对局"
      kicker="ROOM"
      title="A-1024"
      status={<span>01:25</span>}
      actions={<><button type="button">规则</button><button type="button">日志</button></>}
      testId="mobile-game-header"
    />);

    fireEvent.click(screen.getByRole('button', { name: '离开对局' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(screen.getByText('ROOM')).toBeTruthy();
    expect(screen.getByText('A-1024')).toBeTruthy();
    expect(container.querySelector('[data-game-mobile-topbar-status]')?.textContent).toContain('01:25');
    expect(container.querySelector('[data-game-mobile-topbar-actions]')?.children).toHaveLength(2);
    expect(screen.getByTestId('mobile-game-header')).toBeTruthy();
  });
});

describe('GameMobileReplayHeading', () => {
  it('renders an in-flow replay identity and accessible history link', () => {
    const { container } = render(<MemoryRouter>
      <GameMobileReplayHeading
        backTo="/game/test/me"
        backLabel="返回战绩"
        kicker="REPLAY · 房间号"
        title="R-2048"
      />
    </MemoryRouter>);

    expect(screen.getByRole('link', { name: '返回战绩' }).getAttribute('href'))
      .toBe('/game/test/me');
    expect(screen.getByText('REPLAY · 房间号')).toBeTruthy();
    expect(screen.getByText('R-2048')).toBeTruthy();
    expect(container.querySelector('[data-game-mobile-replay-heading]')).toBeTruthy();
  });
});
