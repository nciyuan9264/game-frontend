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

const games: MultiplayerGame[] = [
  { game: 'acquire', maxPlayers: 6 },
  { game: 'splendor', maxPlayers: 4 },
  { game: 'forsale', maxPlayers: 6 },
  { game: 'cantstop', maxPlayers: 4 },
  { game: 'loveletter', maxPlayers: 6 },
  { game: 'sixnimmt', maxPlayers: 10 },
];

const aiNames: Record<MultiplayerGame['game'], string[]> = {
  acquire: ['摩根', '诺兰', '薇拉', '里德', '艾弗里'],
  splendor: ['琥珀', '翡翠', '青金'],
  forsale: ['小满', '阿橙', '松子', '米拉', '可可'],
  cantstop: ['小满', '阿橙', '松子', '米拉'],
  loveletter: ['艾琳', '奥利弗', '莉娅', '诺亚', '苏菲', '米娅'],
  sixnimmt: ['阿麦', '栗子', '小野', '北北', '松果', '团团', '南风', '阿丘', '豆子', '小满'],
};

async function mockPreparationRoom(page: Page, config: MultiplayerGame) {
  const roomID = `${config.game}_sparse_seats`;
  const matchID = `${roomID}-r1`;
  let seq = 1;
  let players = {
    [owner.playerID]: owner,
  } as Record<string, typeof owner>;
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
        playerCount: 1,
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
        let ordinal = 1;
        while (players[`ai_${String(ordinal).padStart(3, '0')}`]) ordinal += 1;
        const playerID = `ai_${String(ordinal).padStart(3, '0')}`;
        players = {
          ...players,
          [playerID]: {
            userID: '',
            playerID,
            displayName: aiNames[config.game][ordinal - 1],
            avatar: '',
            seatIndex: command.payload?.common?.matchSeat?.seatIndex ?? 0,
            online: true,
            ai: true,
            ready: true,
          },
        };
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
  };
}

for (const config of games) {
  test(`${config.game} keeps AI identity independent from seats`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const context = await mockPreparationRoom(page, config);
    await page.goto(`/game/${config.game}/match?roomID=${context.roomID}`);

    const seat = (index: number) =>
      page.locator(`[data-game-room-seat-index="${index}"]`);
    const firstSeat = seat(1);
    const middleSeat = seat(2);
    const lastSeatIndex = config.maxPlayers - 1;
    const lastSeat = seat(lastSeatIndex);

    await expect(lastSeat).toBeVisible();
    await expect(middleSeat).not.toHaveAttribute('data-game-room-player-id', /.+/);
    const lastSeatTag = await lastSeat.evaluate(element => element.tagName);
    if (lastSeatTag === 'BUTTON') {
      await lastSeat.click();
    } else {
      await lastSeat.getByRole('button').click();
    }

    await expect.poll(() => context.commands.filter(command =>
      command.type === 'match_add_ai').length).toBe(1);
    const firstAdd = context.commands.find(command =>
      command.type === 'match_add_ai');
    expect(firstAdd?.payload?.common?.matchSeat?.seatIndex).toBe(lastSeatIndex);
    await expect(page.locator('[data-game-room-player-id]')).toHaveCount(2);
    await expect(page.locator(
      '[data-game-room-player-id="ai_001"]',
    )).toHaveCount(1);
    await expect(lastSeat).toHaveAttribute('data-game-room-player-id', 'ai_001');
    await expect(page.getByText(`${aiNames[config.game][0]} · AI`, { exact: true }))
      .toBeVisible();

    const firstSeatTag = await firstSeat.evaluate(element => element.tagName);
    if (firstSeatTag === 'BUTTON') {
      await firstSeat.click();
    } else {
      await firstSeat.getByRole('button').click();
    }
    await expect.poll(() => context.commands.filter(command =>
      command.type === 'match_add_ai').length).toBe(2);
    await expect(firstSeat).toHaveAttribute('data-game-room-player-id', 'ai_002');
    await expect(page.getByText(`${aiNames[config.game][1]} · AI`, { exact: true }))
      .toBeVisible();

    await firstSeat.getByRole('button').click();
    await page.getByRole('button', { name: '确认移除', exact: true }).click();
    await expect.poll(() => context.commands.filter(command =>
      command.type === 'match_remove_player').length).toBe(1);
    const removeCommand = context.commands.find(command =>
      command.type === 'match_remove_player');
    expect(removeCommand?.payload?.common?.removePlayer?.playerID).toBe('ai_002');
    await expect(firstSeat).not.toHaveAttribute('data-game-room-player-id', /.+/);

    const middleSeatTag = await middleSeat.evaluate(element => element.tagName);
    if (middleSeatTag === 'BUTTON') {
      await middleSeat.click();
    } else {
      await middleSeat.getByRole('button').click();
    }
    await expect.poll(() => context.commands.filter(command =>
      command.type === 'match_add_ai').length).toBe(3);
    const addCommands = context.commands.filter(command =>
      command.type === 'match_add_ai');
    expect(addCommands[2]?.payload?.common?.matchSeat?.seatIndex).toBe(2);
    await expect(middleSeat).toHaveAttribute('data-game-room-player-id', 'ai_002');
    await expect(page.getByText(`${aiNames[config.game][1]} · AI`, { exact: true }))
      .toBeVisible();
  });
}
