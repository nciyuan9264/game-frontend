import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AcquireSessionLoading } from './Loading';

afterEach(cleanup);

describe('Acquire session loading', () => {
  it('provides the stable route and connection loading view', () => {
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AcquireSessionLoading />
    </MemoryRouter>);

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status', { name: '正在建立实时连接' })).toBeTruthy();
    expect(screen.getByText('正在进入这张桌。')).toBeTruthy();
    expect(screen.queryByText('正在进入午夜董事会。')).toBeNull();
    expect(screen.getByText('经典对局')).toBeTruthy();
  });
});
