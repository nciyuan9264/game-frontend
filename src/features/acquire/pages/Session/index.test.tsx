import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionExitState } from './ExitState';

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
