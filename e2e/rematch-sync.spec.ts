import { expect, test, type Page } from '@playwright/test';

const roomID = 'othello_rematch';
const firstMatchID = `${roomID}-r1`;
const nextMatchID = `${roomID}-r2`;
const owner = {
  userID: 'owner-1',
  playerID: 'owner-1',
  displayName: '房主',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};
const guest = {
  userID: 'guest-2',
  playerID: 'guest-2',
  displayName: '访客',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: false,
  ready: true,
};
const players = {
  [owner.playerID]: owner,
  [guest.playerID]: guest,
};

function endedSnapshot() {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID: firstMatchID,
    seq: 60,
    view: {
      othello: {
        playerId: guest.playerID,
        ownerID: owner.playerID,
        visibility: 'private',
        playerData: {
          [owner.playerID]: { side: 'black', discCount: 40 },
          [guest.playerID]: { side: 'white', discCount: 24 },
        },
        result: {
          blackCount: 40,
          whiteCount: 24,
          winnerID: owner.playerID,
          winnerSide: 'black',
          draw: false,
          reason: '双方均无合法落点',
        },
        roomData: {
          board: [
            ...Array.from({ length: 40 }, () => 'black'),
            ...Array.from({ length: 24 }, () => 'white'),
          ],
          currentPlayer: '',
          currentSide: 'black',
          blackPlayerID: owner.playerID,
          whitePlayerID: guest.playerID,
          roundNo: 1,
          gameStatus: 'end',
          legalMoves: [],
          moveLog: [],
          players,
          playerOrder: [owner.playerID, guest.playerID],
        },
      },
    },
  };
}

function nextMatchSnapshot() {
  return {
    schemaVersion: 2,
    type: 'MATCH_SYNC',
    roomID,
    matchID: nextMatchID,
    seq: 0,
    ownerID: owner.playerID,
    status: 'waiting',
    playerID: guest.playerID,
    visibility: 'private',
    maxPlayers: 2,
    players,
    playerOrder: [owner.playerID, guest.playerID],
  };
}

async function mockSession(
  page: Page,
  connectedMatchIDs: string[],
): Promise<() => void> {
  let publishNextMatch = () => {
    throw new Error('the first match websocket is not connected');
  };
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        user_id: guest.userID,
        display_name: guest.displayName,
        avatar: '',
      },
    },
  }));
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        roomID,
        gameType: 'othello',
        status: 'open',
        visibility: 'private',
        ownerUserID: owner.userID,
        ownerPlayerID: owner.playerID,
        maxPlayers: 2,
        playerCount: 2,
        currentMatchID: firstMatchID,
        currentMatchStatus: 'ended',
        nextRoundNo: 2,
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z',
        players: [owner, guest],
        metrics: {
          othello: {
            occupiedCount: 64,
            progressCurrent: 60,
            progressTotal: 60,
          },
        },
      },
    },
  }));
  await page.routeWebSocket('**/ws?**', socket => {
    const matchID = new URL(socket.url()).searchParams.get('matchID') ?? '';
    connectedMatchIDs.push(matchID);
    if (matchID === firstMatchID) {
      socket.send(JSON.stringify(endedSnapshot()));
      publishNextMatch = () => {
        socket.send(JSON.stringify(nextMatchSnapshot()));
      };
      return;
    }
    if (matchID === nextMatchID) {
      socket.send(JSON.stringify(nextMatchSnapshot()));
    }
  });
  return () => publishNextMatch();
}

test('a non-owner reconnects to the next match and returns to the room', async ({
  page,
}) => {
  const connectedMatchIDs: string[] = [];
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));
  const publishNextMatch = await mockSession(page, connectedMatchIDs);

  await page.goto(`/game/othello/match?roomID=${roomID}`);
  await expect(page.getByRole('button', {
    name: '等待房主再来一局',
  })).toBeVisible();
  publishNextMatch();

  await expect.poll(() => connectedMatchIDs).toContain(nextMatchID);
  await expect(page.getByText('你已准备，等待房主开始。')).toBeVisible();
  await expect(page.getByText('准备中', { exact: true })).toBeVisible();
  expect(connectedMatchIDs.filter(value => value === nextMatchID)).toHaveLength(1);
  expect(pageErrors).toEqual([]);
});
