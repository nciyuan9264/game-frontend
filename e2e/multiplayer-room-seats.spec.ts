import { expect, test, type Page } from '@playwright/test';

type MultiplayerGame = {
  game: 'acquire' | 'splendor' | 'forsale' | 'cantstop' | 'loveletter' | 'sixnimmt';
  maxPlayers: number;
};

type RoomCommand = {
  type: string;
  payload?: {
    common?: {
      matchSeat?: { seatIndex?: number };
      removePlayer?: { playerID?: string };
    };
  };
};

const profile = {
  user_id: 'seat-owner',
  display_name: 'Seat Owner',
  avatar: '',
};

const owner = {
  userID: profile.user_id,
  playerID: profile.user_id,
  displayName: profile.display_name,
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};

const existingAI = {
  userID: '',
  playerID: 'ai_2',
  displayName: 'AI 02',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: true,
  ready: true,
};

const games: MultiplayerGame[] = [
  { game: 'acquire', maxPlayers: 6 },
  { game: 'splendor', maxPlayers: 4 },
  { game: 'forsale', maxPlayers: 6 },
  { game: 'cantstop', maxPlayers: 4 },
  { game: 'loveletter', maxPlayers: 6 },
  { game: 'sixnimmt', maxPlayers: 10 },
];

async function mockPreparationRoom(page: Page, config: MultiplayerGame) {
  const roomID = `${config.game}_sparse_seats`;
  const matchID = `${roomID}-r1`;
  const targetSeatIndex = config.maxPlayers - 1;
  const targetPlayerID = `${config.game}_ai_last`;
  const targetAI = {
    userID: '',
    playerID: targetPlayerID,
    displayName: `${config.game} Last AI`,
    avatar: '',
    seatIndex: targetSeatIndex,
    online: true,
    ai: true,
    ready: true,
  };
  let seq = 1;
  let players = {
    [owner.playerID]: owner,
    [existingAI.playerID]: existingAI,
  } as Record<string, typeof owner | typeof existingAI | typeof targetAI>;
  const commands: RoomCommand[] = [];
  const snapshot = () => ({
    schemaVersion: 2,
    type: 'MATCH_SYNC',
    roomID,
    matchID,
    seq,
    ownerID: owner.playerID,
    playerID: owner.playerID,
    status: 'match',
    visibility: 'private',
    maxPlayers: config.maxPlayers,
    players,
    playerOrder: Object.values(players)
      .sort((left, right) => left.seatIndex - right.seatIndex)
      .map(player => player.playerID),
  });

  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: profile,
    },
  }));
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        roomID,
        gameType: config.game,
        status: 'match',
        visibility: 'private',
        ownerUserID: owner.userID,
        ownerPlayerID: owner.playerID,
        maxPlayers: config.maxPlayers,
        playerCount: 2,
        currentMatchID: matchID,
        currentMatchStatus: 'preparing',
        nextRoundNo: 1,
        createdAt: '2026-10-30T00:00:00Z',
        updatedAt: '2026-10-30T00:00:00Z',
        players: Object.values(players),
        metrics: {},
      },
    },
  }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(snapshot()));
    socket.onMessage(message => {
      const command = JSON.parse(String(message)) as RoomCommand;
      commands.push(command);
      if (command.type === 'match_add_ai') {
        players = { ...players, [targetPlayerID]: targetAI };
        seq += 1;
        socket.send(JSON.stringify(snapshot()));
      }
      if (command.type === 'match_remove_player') {
        const removedID = command.payload?.common?.removePlayer?.playerID;
        players = Object.fromEntries(
          Object.entries(players).filter(([id]) => id !== removedID),
        ) as typeof players;
        seq += 1;
        socket.send(JSON.stringify(snapshot()));
      }
    });
  });

  return {
    commands,
    roomID,
    targetPlayerID,
    targetSeatIndex,
  };
}

for (const config of games) {
  test(`${config.game} keeps sparse AI seats unique and removable`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const context = await mockPreparationRoom(page, config);
    await page.goto(`/game/${config.game}/match?roomID=${context.roomID}`);

    const seat = (index: number) =>
      page.locator(`[data-game-room-seat-index="${index}"]`);
    const middleSeat = seat(2);
    const targetSeat = seat(context.targetSeatIndex);

    await expect(targetSeat).toBeVisible();
    await expect(middleSeat).not.toHaveAttribute('data-game-room-player-id', /.+/);
    const targetTag = await targetSeat.evaluate(element => element.tagName);
    if (targetTag === 'BUTTON') {
      await targetSeat.click();
    } else {
      await targetSeat.getByRole('button').click();
    }

    await expect.poll(() => context.commands.filter(command =>
      command.type === 'match_add_ai').length).toBe(1);
    const addCommand = context.commands.find(command =>
      command.type === 'match_add_ai');
    expect(addCommand?.payload?.common?.matchSeat?.seatIndex)
      .toBe(context.targetSeatIndex);

    await expect(page.locator('[data-game-room-player-id]')).toHaveCount(3);
    await expect(page.locator(
      `[data-game-room-player-id="${context.targetPlayerID}"]`,
    )).toHaveCount(1);
    await expect(seat(context.targetSeatIndex))
      .toHaveAttribute('data-game-room-player-id', context.targetPlayerID);
    await expect(middleSeat).not.toHaveAttribute('data-game-room-player-id', /.+/);

    await seat(context.targetSeatIndex).getByRole('button').click();
    await page.getByRole('button', { name: '确认移除', exact: true }).click();

    await expect.poll(() => context.commands.filter(command =>
      command.type === 'match_remove_player').length).toBe(1);
    const removeCommand = context.commands.find(command =>
      command.type === 'match_remove_player');
    expect(removeCommand?.payload?.common?.removePlayer?.playerID)
      .toBe(context.targetPlayerID);

    await expect(page.locator('[data-game-room-player-id]')).toHaveCount(2);
    await expect(seat(context.targetSeatIndex))
      .not.toHaveAttribute('data-game-room-player-id', /.+/);
  });
}
