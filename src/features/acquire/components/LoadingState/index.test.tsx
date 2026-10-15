import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AcquireLoading } from '.';

afterEach(cleanup);

describe('AcquireLoading', () => {
  it('renders the shared branded loading state with caller-specific copy', () => {
    const { container } = render(<AcquireLoading
      title="正在进入这张桌。"
      description="正在同步玩家席位与最新对局状态"
      status="正在建立实时连接"
      skeletons={3}
    />);

    expect(screen.getByRole('status', { name: '正在建立实时连接' })).toBeTruthy();
    expect(screen.getByText('BUILDING THE NEXT CITY')).toBeTruthy();
    expect(screen.getByText('正在进入这张桌。')).toBeTruthy();
    expect(screen.getByText('正在同步玩家席位与最新对局状态')).toBeTruthy();
    expect(container.querySelector('section > div:first-child')?.children).toHaveLength(1);
    expect(container.querySelectorAll('div > i')).toHaveLength(4);
  });
});
