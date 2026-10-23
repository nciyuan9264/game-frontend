import { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { useAcquireLeave } from './useAcquireLeave';

afterEach(cleanup);
it('keeps the live route on cancel and exits to the lobby once confirmed, including StrictMode', async () => {
  const close = vi.fn();
  function Match() {
    const leave = useAcquireLeave(close);
    return <><p>live match</p><button onClick={leave.request}>leave</button>{leave.visible && <div role="dialog">
      <button onClick={leave.cancel}>cancel</button><button onClick={leave.confirm}>confirm</button>
    </div>}</>;
  }
  window.history.replaceState({ idx: 0 }, '', '/game/acquire/match?roomID=test');
  render(<StrictMode><BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes>
    <Route path="/game/acquire/match" element={<Match />} />
    <Route path="/game/acquire" element={<p>lobby</p>} />
  </Routes></BrowserRouter></StrictMode>);
  fireEvent.click(screen.getByText('leave'));
  await screen.findByRole('dialog');
  expect(screen.getByText('live match')).toBeTruthy();
  expect(window.location.search).toBe('?roomID=test');
  fireEvent.click(screen.getByText('cancel'));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(close).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('leave'));
  await screen.findByRole('dialog');
  fireEvent.click(screen.getByText('confirm'));
  await screen.findByText('lobby');
  await waitFor(() => expect(window.location.pathname).toBe('/game/acquire'));
  expect(close).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('live match')).toBeNull();
});
