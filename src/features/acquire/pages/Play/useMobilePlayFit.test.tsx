import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMobilePlayFit } from './useMobilePlayFit';

function installFrameQueue() {
  let nextID = 0;
  const frames = new Map<number, FrameRequestCallback>();
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    const id = ++nextID;
    frames.set(id, callback);
    return id;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => {
    frames.delete(id);
  }));
  return {
    flush: () => {
      const pending = Array.from(frames.values());
      frames.clear();
      act(() => {
        pending.forEach(callback => callback(performance.now()));
      });
    },
  };
}

function setViewportHeight(height: number) {
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
}

function mockBottom(getBottom: () => number) {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 390,
    bottom: getBottom(),
    width: 390,
    height: getBottom(),
    toJSON: () => ({}),
  } as DOMRect));
}

function Probe({ enabled, version = 'initial' }: { enabled: boolean; version?: string }) {
  const { containerRef, fitLevel } = useMobilePlayFit(enabled);
  return <div ref={containerRef} data-testid="root" data-level={fitLevel} data-version={version} />;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useMobilePlayFit', () => {
  it('keeps the normal level when disabled', () => {
    setViewportHeight(600);
    mockBottom(() => 900);

    render(<Probe enabled={false} />);

    expect(screen.getByTestId('root').getAttribute('data-level')).toBe('0');
  });

  it('computes a compact level once from the initial overflow', async () => {
    setViewportHeight(600);
    mockBottom(() => 660);

    render(<Probe enabled />);

    await waitFor(() => expect(screen.getByTestId('root').getAttribute('data-level')).toBe('2'));
  });

  it('does not remeasure when game content changes without a viewport change', async () => {
    setViewportHeight(600);
    let bottom = 660;
    mockBottom(() => bottom);
    const { rerender } = render(<Probe enabled version="initial" />);
    await waitFor(() => expect(screen.getByTestId('root').getAttribute('data-level')).toBe('2'));

    bottom = 560;
    rerender(<Probe enabled version="content-change" />);

    expect(screen.getByTestId('root').getAttribute('data-level')).toBe('2');
  });

  it('remeasures only after the viewport changes', async () => {
    const frames = installFrameQueue();
    setViewportHeight(600);
    let bottom = 660;
    mockBottom(() => bottom);
    render(<Probe enabled />);
    await waitFor(() => expect(screen.getByTestId('root').getAttribute('data-level')).toBe('2'));

    bottom = 468;
    setViewportHeight(720);
    act(() => window.dispatchEvent(new Event('resize')));
    frames.flush();

    await waitFor(() => expect(screen.getByTestId('root').getAttribute('data-level')).toBe('0'));
  });
});
