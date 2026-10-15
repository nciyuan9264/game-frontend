import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '.';

afterEach(cleanup);

describe('Acquire AppShell', () => {
  it('can hide the shell header while preserving page content', () => {
    const { container } = render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AppShell inMatch hideRail hideHeader title="经典对局">
      <div>GAME CONTENT</div>
    </AppShell></MemoryRouter>);

    expect(container.querySelector('header')).toBeNull();
    expect(container.firstElementChild?.className).toContain('hideHeader');
    expect(screen.getByText('GAME CONTENT')).toBeTruthy();
  });

  it('keeps the shell header by default', () => {
    const { container } = render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AppShell inMatch hideRail title="准备房间">
      <div>ROOM CONTENT</div>
    </AppShell></MemoryRouter>);

    expect(container.querySelector('header')).toBeTruthy();
  });
});
