import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useReplayPanel } from './useReplayPanel';

afterEach(cleanup);

function Harness() {
  const panel = useReplayPanel();
  return <section ref={panel.panelRef} style={panel.positionStyle}>
    <button type="button" aria-label="移动回放面板"
      {...panel.dragHandleProps}>移动</button>
    <button type="button" aria-label={panel.collapsed ? '展开' : '收起'}
      onClick={panel.toggleCollapsed}>{panel.collapsed ? '展开' : '收起'}</button>
    {panel.collapsed && <button type="button" aria-label="移动折叠回放面板"
      {...panel.dragHandleProps}>步数</button>}
  </section>;
}

describe('useReplayPanel', () => {
  it('moves with the keyboard and resets with Home', () => {
    render(<Harness />);
    const handle = screen.getByRole('button', { name: '移动回放面板' });
    const panel = handle.closest('section');

    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(panel?.getAttribute('style')).toContain('--replay-panel-x: 24px');
    fireEvent.keyDown(handle, { key: 'ArrowUp' });
    expect(panel?.getAttribute('style')).toContain('--replay-panel-y: -24px');
    fireEvent.keyDown(handle, { key: 'Home' });
    expect(panel?.getAttribute('style')).toContain('--replay-panel-x: 0px');
    expect(panel?.getAttribute('style')).toContain('--replay-panel-y: 0px');
  });

  it('exposes a movable handle while collapsed', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '收起' }));
    const collapsed = screen.getByRole('button', {
      name: '移动折叠回放面板',
    });
    expect(screen.getByRole('button', { name: '展开' })).toBeTruthy();

    fireEvent.keyDown(collapsed, { key: 'ArrowLeft' });
    expect(collapsed.closest('section')?.getAttribute('style'))
      .toContain('--replay-panel-x: -24px');
  });
});
