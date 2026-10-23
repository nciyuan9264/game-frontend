import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGameLeave } from './useGameLeave';

afterEach(cleanup);

describe('useGameLeave', () => {
  it.each([
    '/game/acquire',
    '/game/davinci',
    '/game/splendor',
  ])('lets browser Back exit directly to %s', async lobbyPath => {
    const closeConnection = vi.fn();

    function Match() {
      const leave = useGameLeave(closeConnection, lobbyPath);
      return <><p>live match</p><button onClick={leave.request}>leave</button>
        {leave.visible && <div role="dialog">
          <button onClick={leave.cancel}>cancel</button>
          <button onClick={leave.confirm}>confirm</button>
        </div>}</>;
    }

    window.history.replaceState({ idx: 0 }, '', lobbyPath);
    window.history.pushState(
      { idx: 1 },
      '',
      `${lobbyPath}/match?roomID=test`
    );
    render(<BrowserRouter>
      <Routes>
        <Route path={`${lobbyPath}/match`} element={<Match />} />
        <Route path={lobbyPath} element={<p>lobby</p>} />
      </Routes>
    </BrowserRouter>);

    act(() => window.history.back());
    await screen.findByText('lobby');
    await waitFor(() => expect(window.location.pathname).toBe(lobbyPath));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(closeConnection).not.toHaveBeenCalled();
  });

  it.each([
    '/game/acquire',
    '/game/davinci',
    '/game/splendor',
  ])('keeps in-page confirmation before leaving to %s', async lobbyPath => {
    const closeConnection = vi.fn();

    function Match() {
      const leave = useGameLeave(closeConnection, lobbyPath);
      return <><p>live match</p><button onClick={leave.request}>leave</button>
        {leave.visible && <div role="dialog">
          <button onClick={leave.cancel}>cancel</button>
          <button onClick={leave.confirm}>confirm</button>
        </div>}</>;
    }

    window.history.replaceState(
      { idx: 0 },
      '',
      `${lobbyPath}/match?roomID=test`
    );
    render(<BrowserRouter>
      <Routes>
        <Route path={`${lobbyPath}/match`} element={<Match />} />
        <Route path={lobbyPath} element={<p>lobby</p>} />
      </Routes>
    </BrowserRouter>);

    fireEvent.click(screen.getByText('leave'));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByText('cancel'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(closeConnection).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('leave'));
    fireEvent.click(await screen.findByText('confirm'));
    await screen.findByText('lobby');
    await waitFor(() => expect(window.location.pathname).toBe(lobbyPath));
    expect(closeConnection).toHaveBeenCalledTimes(1);
  });
});
