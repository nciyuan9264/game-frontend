import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { installGameNavigationGuard } from '@/features/game-core/model/navigationGuard';
import { useAcquireLeave } from './useAcquireLeave';

let removeNavigationGuard: () => void;
beforeEach(() => { removeNavigationGuard = installGameNavigationGuard(); });
afterEach(() => { cleanup(); removeNavigationGuard(); });
it('keeps the live route on Back/cancel and exits to the lobby once confirmed, including StrictMode', async () => {
  const close = vi.fn();
  function Match() {
    const leave = useAcquireLeave(close);
    return <><p>live match</p>{leave.visible && <div role="dialog">
      <button onClick={leave.cancel}>cancel</button><button onClick={leave.confirm}>confirm</button>
    </div>}</>;
  }
  window.history.replaceState({ idx: 0 }, '', '/game/acquire/match?roomID=test');
  render(<StrictMode><BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes>
    <Route path="/game/acquire/match" element={<Match />} />
    <Route path="/game/acquire" element={<p>lobby</p>} />
  </Routes></BrowserRouter></StrictMode>);
  act(() => window.history.back());
  await screen.findByRole('dialog');
  expect(screen.getByText('live match')).toBeTruthy();
  expect(window.location.search).toBe('?roomID=test');
  fireEvent.click(screen.getByText('cancel'));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(close).not.toHaveBeenCalled();
  act(() => window.history.back());
  await screen.findByRole('dialog');
  fireEvent.click(screen.getByText('confirm'));
  await screen.findByText('lobby');
  await waitFor(() => expect(window.location.pathname).toBe('/game/acquire'));
  expect(close).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('live match')).toBeNull();
});
