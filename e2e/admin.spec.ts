import { expect, test, type Page } from '@playwright/test';
import { observePage } from './helpers';

const windowData = {
  timezone: 'Asia/Shanghai',
  start_date: '2026-10-04',
  end_date: '2026-11-02',
  days: 30,
  generated_at_unix: '1793548800',
};

const dateAt = (offset: number) => {
  const date = new Date(Date.UTC(2026, 9, 4 + offset));
  return date.toISOString().slice(0, 10);
};

async function mockAdminAPI(page: Page) {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 200,
      message: 'ok',
      data: {
        user_id: '1',
        email: 'admin@example.com',
        name: '平台管理员',
        display_name: '平台管理员',
        roles: ['player', 'admin'],
      },
    },
  }));
  await page.route('**/pam-api/platform/admin/analytics/overview?*', route => {
    const requestURL = new URL(route.request().url());
    const allTime = requestURL.searchParams.get('all_time') === 'true';
    const startDate = allTime
      ? '2026-01-01'
      : requestURL.searchParams.get('start_date') || windowData.start_date;
    const endDate = requestURL.searchParams.get('end_date') || windowData.end_date;
    const firstDay = new Date(`${startDate}T00:00:00Z`);
    const lastDay = new Date(`${endDate}T00:00:00Z`);
    const days = Math.floor((lastDay.getTime() - firstDay.getTime()) / 86_400_000) + 1;
    return route.fulfill({
      json: {
        status_code: 200,
        message: 'ok',
        data: {
          window: { ...windowData, start_date: startDate, end_date: endDate, days },
          metrics: {
            total_users: '1280',
            total_games: '1042',
            new_users: '140',
            dau: '86',
            wau: '310',
            mau: '720',
            dau_mau_rate: 0.119,
            first_match_conversion_rate: 0.64,
            d1_retention_rate: 0.42,
            d7_retention_rate: 0.27,
            d30_retention_rate: 0.12,
            games_started: '930',
            games_completed: '810',
            games_abandoned: '60',
            completion_rate: 0.871,
            game_duration_seconds: '972000',
            player_duration_seconds: '1728000',
            average_game_duration_seconds: '1200',
            average_player_duration_seconds: '2400',
          },
          daily: Array.from({ length: days }, (_, index) => ({
            date: new Date(firstDay.getTime() + index * 86_400_000).toISOString().slice(0, 10),
            new_users: String(3 + index % 7),
            active_users: String(35 + index * 2),
            games_started: String(20 + index),
            games_completed: String(18 + index),
            games_abandoned: String(index % 3),
            game_duration_seconds: String(12000 + index * 600),
            player_duration_seconds: String(22000 + index * 900),
          })),
        },
      },
    });
  });
  const adminUsers = [
    {
      user_id: '7',
      display_name: '北海玩家',
      email: 'player@example.com',
      created_at_unix: '1793376000',
      first_active_date: '2026-10-30',
      last_active_at_unix: '1793545200',
      active_days: '3',
      games_played: '8',
      player_duration_seconds: '14400',
      favorite_game_type: 'splendor',
    },
    {
      user_id: '8',
      display_name: '江城玩家',
      created_at_unix: '1793289600',
      active_days: '0',
      games_played: '0',
      player_duration_seconds: '0',
    },
  ];
  await page.route('**/pam-api/platform/admin/analytics/users?*', route => {
    const url = new URL(route.request().url());
    const users = [...adminUsers];
    if (url.searchParams.get('sort_by') === 'games_played') {
      const direction = url.searchParams.get('sort_order') === 'desc' ? -1 : 1;
      users.sort((left, right) =>
        (Number(left.games_played) - Number(right.games_played)) * direction);
    }
    return route.fulfill({
      json: {
        status_code: 200,
        message: 'ok',
        data: {
          window: windowData,
          page: Number(url.searchParams.get('page') || 1),
          page_size: 20,
          total: '2',
          users,
        },
      },
    });
  });
  await page.route('**/pam-api/platform/admin/analytics/users/7', route => route.fulfill({
    json: {
      status_code: 200,
      message: 'ok',
      data: {
        window: windowData,
        user: {
          user_id: '7',
          display_name: '北海玩家',
          email: 'player@example.com',
          created_at_unix: '1793376000',
          first_active_date: '2026-10-30',
          last_active_at_unix: '1793545200',
          active_days: '3',
          games_played: '8',
          player_duration_seconds: '14400',
          favorite_game_type: 'splendor',
        },
        daily: Array.from({ length: 30 }, (_, index) => ({
          date: dateAt(index),
          games_played: index > 26 ? '2' : '0',
          player_duration_seconds: index > 26 ? '3600' : '0',
        })),
        games: [{
          game_type: 'splendor',
          games_played: '6',
          active_days: '3',
          player_duration_seconds: '10800',
          share_rate: 0.75,
        }],
      },
    },
  }));
  await page.route('**/pam-api/platform/admin/analytics/games?*', route => {
    const requestURL = new URL(route.request().url());
    const allTime = requestURL.searchParams.get('all_time') === 'true';
    const startDate = allTime
      ? '1970-01-01'
      : requestURL.searchParams.get('start_date') || windowData.start_date;
    const endDate = requestURL.searchParams.get('end_date') || windowData.end_date;
    return route.fulfill({
      json: {
        status_code: 200,
        message: 'ok',
        data: {
          window: { ...windowData, start_date: startDate, end_date: endDate },
          games: [{
            game_type: 'splendor',
            active_users: '120',
            games_started: '260',
            games_completed: '240',
            games_abandoned: '10',
            completion_rate: 0.923,
            game_duration_seconds: '288000',
            player_duration_seconds: '576000',
            average_game_duration_seconds: '1200',
            average_human_players: 2.4,
          }],
        },
      },
    });
  });
  const matches = [
    {
      game_id: '42',
      room_id: 'SP-1042',
      match_id: 'match-7',
      game_type: 'splendor',
      started_at_unix: '1793541600',
      ended_at_unix: '1793545200',
      duration_seconds: '3600',
      end_reason: 'completed',
      max_players: 4,
      players: [
        {
          user_id: '7',
          player_id: 'player-7',
          display_name: '北海玩家',
          seat_index: 0,
          is_ai: false,
          final_rank: 1,
          is_winner: true,
        },
        {
          user_id: '8',
          player_id: 'player-8',
          display_name: '江城玩家',
          seat_index: 1,
          is_ai: false,
          final_rank: 2,
          is_winner: false,
        },
      ],
    },
    {
      game_id: '41',
      room_id: 'AQ-881',
      match_id: 'match-6',
      game_type: 'acquire',
      started_at_unix: '1793534400',
      ended_at_unix: '1793536200',
      duration_seconds: '1800',
      end_reason: 'abandoned',
      max_players: 6,
      players: [{
        user_id: '7',
        player_id: 'player-7',
        display_name: '北海玩家',
        seat_index: 0,
        is_ai: false,
        is_winner: false,
      }],
    },
  ];
  await page.route('**/pam-api/platform/admin/analytics/matches?*', route => {
    const url = new URL(route.request().url());
    const query = (url.searchParams.get('query') || '').toLowerCase();
    const gameType = url.searchParams.get('game_type') || '';
    const endReason = url.searchParams.get('end_reason') || '';
    const filtered = matches.filter(match =>
      (!gameType || match.game_type === gameType)
      && (!endReason || match.end_reason === endReason)
      && (!query || [
        match.room_id,
        match.match_id,
        match.game_id,
        ...match.players.flatMap(player => [player.user_id, player.player_id, player.display_name]),
      ].some(value => value?.toLowerCase().includes(query))));
    return route.fulfill({
      json: {
        status_code: 200,
        message: 'ok',
        data: {
          matches: filtered,
          page: Number(url.searchParams.get('page') || 1),
          page_size: Number(url.searchParams.get('page_size') || 20),
          total: String(filtered.length),
        },
      },
    });
  });
  await page.route('**/pam-api/platform/admin/analytics/live', route => route.fulfill({
    json: {
      status_code: 200,
      message: 'ok',
      data: {
        generated_at_unix: '1793548800',
        active_rooms: '1',
        active_matches: '1',
        online_players: '2',
        games: [{ game_type: 'splendor', active_rooms: '1', active_matches: '1', online_players: '2' }],
        rooms: [{
          room_id: 'SP-1042',
          match_id: 'match-7',
          game_type: 'splendor',
          status: 'running',
          human_players: '2',
          online_players: '2',
          started_at_unix: '1793545200',
          players: [
            {
              user_id: '7',
              display_name: '北海玩家',
              avatar: 'https://example.com/avatar.png',
              online: true,
              is_owner: true,
            },
            {
              user_id: '8',
              display_name: '江城玩家',
              online: true,
              is_owner: false,
            },
          ],
        }],
      },
    },
  }));
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-02T04:00:00Z'));
  await mockAdminAPI(page);
});

test('public home silently hides the admin shortcut when signed out', async ({ page }) => {
  await page.unroute('**/pam-api/platform/auth/profile');
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    status: 401,
    json: { status_code: 401, message: 'unauthorized' },
  }));
  await page.route('**/pam-api/platform/auth/refresh', route => route.fulfill({
    status: 401,
    json: { status_code: 401, message: 'unauthorized' },
  }));

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: '桌游广场' })).toBeVisible();
  await expect(page.getByRole('button', { name: '打开对局记录' })).toHaveCount(0);
  expect(new URL(page.url()).pathname).toBe('/');
});

test('admin analytics routes render and preserve duration semantics', async ({ page }) => {
  const assertClean = observePage(page);
  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: '数据总览' })).toBeVisible();
  await expect(page.getByText('对局总数', { exact: true })).toBeVisible();
  await expect(page.getByText('1,042', { exact: true })).toBeVisible();
  await expect(page.getByText('用户增长与活跃')).toBeVisible();
  await expect(page.getByText('对局开始、完成与废弃')).toBeVisible();
  await expect(page.getByText('对局活跃时长（估算）')).toBeVisible();
  await expect(page.getByText('废弃对局', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('截至 2026-11-02 的累计未注销账号')).toBeVisible();
  await expect(page.getByText('区间真人累计对局时长 / 区间活跃用户数（估算）')).toBeVisible();
  await expect(page.getByText('在线时长', { exact: true })).toHaveCount(0);
  const growthChart = page.getByRole('img', { name: '所选日期范围累计用户和活跃用户趋势' });
  await expect(growthChart.locator('title').filter({
    hasText: '2026-10-04 · 累计用户 1108',
  })).toHaveCount(1);
  await expect(growthChart.locator('title').filter({
    hasText: '2026-11-02 · 累计用户 1280',
  })).toHaveCount(1);
  await growthChart.locator('svg').hover({ position: { x: 360, y: 140 } });
  const chartTooltip = page.locator('[data-chart-tooltip]');
  await expect(chartTooltip).toBeVisible();
  await expect(chartTooltip).toContainText('累计用户');
  await expect(chartTooltip).toContainText('活跃用户');

  await page.getByRole('button', { name: /选择数据日期范围/ }).click();
  await expect(page.getByRole('dialog', { name: '选择数据日期范围' })).toBeVisible();
  const rangeRequest = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname.endsWith('/platform/admin/analytics/overview')
      && url.searchParams.get('start_date') === '2026-10-27'
      && url.searchParams.get('end_date') === '2026-11-02';
  });
  await page.getByRole('button', { name: '最近 7 天' }).click();
  await rangeRequest;
  await expect(page.getByRole('button', { name: /选择数据日期范围/ }))
    .toContainText('2026-10-27 至 2026-11-02');

  await expect(page.getByText('2026-10-27 至 2026-11-02 内注册的账号')).toBeVisible();

  await page.getByRole('button', { name: /选择数据日期范围/ }).click();
  const overviewAllTimeRequest = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname.endsWith('/platform/admin/analytics/overview')
      && url.searchParams.get('all_time') === 'true'
      && !url.searchParams.has('start_date')
      && !url.searchParams.has('end_date');
  });
  await page.getByRole('button', { name: '全部时间' }).click();
  await overviewAllTimeRequest;
  await expect(page.getByRole('button', { name: /选择数据日期范围/ }))
    .toContainText('全部时间');

  await page.getByRole('button', { name: /选择数据日期范围/ }).click();
  await page.getByLabel('开始日期').fill('2026-10-01');
  await page.getByLabel('结束日期').fill('2026-10-15');
  const customRangeRequest = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname.endsWith('/platform/admin/analytics/overview')
      && url.searchParams.get('start_date') === '2026-10-01'
      && url.searchParams.get('end_date') === '2026-10-15';
  });
  await page.getByRole('button', { name: '应用范围' }).click();
  await customRangeRequest;
  await expect(page.getByRole('button', { name: /选择数据日期范围/ }))
    .toContainText('2026-10-01 至 2026-10-15');

  const desktopScroll = await page.locator('main').evaluate(main => {
    const workspace = main.parentElement;
    if (!workspace) return null;
    const before = workspace.scrollTop;
    workspace.scrollTo({ top: workspace.scrollHeight });
    return {
      before,
      after: workspace.scrollTop,
      clientHeight: workspace.clientHeight,
      scrollHeight: workspace.scrollHeight,
      overflowY: getComputedStyle(workspace).overflowY,
    };
  });
  expect(desktopScroll?.overflowY).toBe('auto');
  expect(desktopScroll?.scrollHeight).toBeGreaterThan(desktopScroll?.clientHeight ?? 0);
  expect(desktopScroll?.after).toBeGreaterThan(desktopScroll?.before ?? 0);

  await page.getByRole('link', { name: '用户' }).click();
  await expect(page.getByRole('heading', { name: '用户活跃' })).toBeVisible();
  await expect(page.getByText('北海玩家')).toBeVisible();
  const usersTable = page.getByRole('table');
  const ascendingSortRequest = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname.endsWith('/platform/admin/analytics/users')
      && url.searchParams.get('page') === '1'
      && url.searchParams.get('sort_by') === 'games_played'
      && url.searchParams.get('sort_order') === 'asc';
  });
  await page.getByRole('button', { name: '按参与对局升序排序' }).click();
  await ascendingSortRequest;
  await expect(usersTable.locator('tbody tr').first()).toContainText('江城玩家');
  const descendingSortRequest = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname.endsWith('/platform/admin/analytics/users')
      && url.searchParams.get('page') === '1'
      && url.searchParams.get('sort_by') === 'games_played'
      && url.searchParams.get('sort_order') === 'desc';
  });
  await page.getByRole('button', { name: '按参与对局降序排序' }).click();
  await descendingSortRequest;
  await expect(usersTable.locator('tbody tr').first()).toContainText('北海玩家');
  await page.getByRole('link', { name: /北海玩家/ }).click();
  await expect(page.getByRole('heading', { name: '用户详情' })).toBeVisible();
  await expect(page.getByText('游戏偏好')).toBeVisible();

  await page.getByRole('link', { name: '游戏', exact: true }).click();
  await expect(page.getByRole('heading', { name: '游戏分析' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: '游戏活跃分析' }).getByText('璀璨宝石'),
  ).toBeVisible();

  await page.getByRole('button', { name: /选择数据日期范围/ }).click();
  await expect(page.getByRole('dialog', { name: '选择数据日期范围' })).toBeVisible();
  const gamesRangeRequest = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname.endsWith('/platform/admin/analytics/games')
      && url.searchParams.get('start_date') === '2026-10-27'
      && url.searchParams.get('end_date') === '2026-11-02';
  });
  await page.getByRole('button', { name: '最近 7 天' }).click();
  await gamesRangeRequest;
  await expect(page.getByRole('button', { name: /选择数据日期范围/ }))
    .toContainText('2026-10-27 至 2026-11-02');

  await page.getByRole('button', { name: /选择数据日期范围/ }).click();
  const allTimeRequest = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname.endsWith('/platform/admin/analytics/games')
      && url.searchParams.get('all_time') === 'true'
      && !url.searchParams.has('start_date')
      && !url.searchParams.has('end_date');
  });
  await page.getByRole('button', { name: '全部时间' }).click();
  await allTimeRequest;
  await expect(page.getByRole('button', { name: /选择数据日期范围/ }))
    .toContainText('全部时间');

  await page.getByRole('link', { name: '对局', exact: true }).click();
  await expect(page.getByRole('heading', { name: '对局记录' })).toBeVisible();
  const matchesTable = page.getByRole('region', { name: '历史对局列表' });
  await expect(matchesTable.getByText('SP-1042')).toBeVisible();
  await expect(matchesTable.getByText('match-7')).toBeVisible();
  await expect(matchesTable.getByText('正常完成')).toBeVisible();
  await expect(matchesTable.getByText('北海玩家').first()).toBeVisible();
  await expect(matchesTable.getByLabel('胜者')).toBeVisible();

  const gameFilterRequest = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname.endsWith('/platform/admin/analytics/matches')
      && url.searchParams.get('game_type') === 'splendor';
  });
  await page.getByLabel('按游戏筛选').selectOption('splendor');
  await gameFilterRequest;
  const resultFilterRequest = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname.endsWith('/platform/admin/analytics/matches')
      && url.searchParams.get('game_type') === 'splendor'
      && url.searchParams.get('end_reason') === 'completed';
  });
  await page.getByLabel('按对局结果筛选').selectOption('completed');
  await resultFilterRequest;
  const matchSearchRequest = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname.endsWith('/platform/admin/analytics/matches')
      && url.searchParams.get('query') === '北海玩家';
  });
  await page.getByLabel('搜索历史对局').fill('北海玩家');
  await page.getByRole('button', { name: '搜索', exact: true }).click();
  await matchSearchRequest;
  await expect(matchesTable.getByText('SP-1042')).toBeVisible();

  await page.getByRole('link', { name: '实时' }).click();
  await expect(page.getByRole('heading', { name: '实时概况' })).toBeVisible();
  const liveRooms = page.getByRole('region', { name: '实时房间列表' });
  await expect(liveRooms.getByText('SP-1042')).toBeVisible();
  await expect(liveRooms.getByText('北海玩家')).toBeVisible();
  await expect(liveRooms.getByText('江城玩家')).toBeVisible();
  await expect(liveRooms.getByLabel('房主')).toBeVisible();
  const liveRefresh = page.waitForResponse(response =>
    response.url().endsWith('/pam-api/platform/admin/analytics/live'));
  await liveRefresh;
  await expect(liveRooms.getByText('北海玩家')).toBeVisible();
  await expect(liveRooms.getByText('江城玩家')).toBeVisible();

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '打开对局记录' }).click();
  await expect(page.getByRole('heading', { name: '对局记录' })).toBeVisible();
  assertClean();
});

test('admin navigation fits a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('navigation', { name: '后台导航' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '数据总览' })).toBeVisible();

  const layout = await page.evaluate(() => ({
    documentFits: document.documentElement.scrollWidth <= window.innerWidth,
    navRect: document.querySelector('nav')?.getBoundingClientRect().toJSON(),
    viewportHeight: window.innerHeight,
  }));
  expect(layout.documentFits).toBe(true);
  expect(layout.navRect?.bottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
  expect(layout.navRect?.top).toBeGreaterThan(500);

  await page.getByRole('button', { name: /选择数据日期范围/ }).click();
  const datePickerLayout = await page.getByRole('dialog', { name: '选择数据日期范围' }).evaluate(dialog => {
    const rect = dialog.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      viewportWidth: window.innerWidth,
    };
  });
  expect(datePickerLayout.left).toBeGreaterThanOrEqual(0);
  expect(datePickerLayout.right).toBeLessThanOrEqual(datePickerLayout.viewportWidth);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '选择数据日期范围' })).toHaveCount(0);

  const mobileScroll = await page.locator('main').evaluate(main => {
    const workspace = main.parentElement;
    if (!workspace) return null;
    workspace.scrollTo({ top: workspace.scrollHeight });
    return {
      scrollTop: workspace.scrollTop,
      clientHeight: workspace.clientHeight,
      scrollHeight: workspace.scrollHeight,
      overflowY: getComputedStyle(workspace).overflowY,
    };
  });
  expect(mobileScroll?.overflowY).toBe('auto');
  expect(mobileScroll?.scrollHeight).toBeGreaterThan(mobileScroll?.clientHeight ?? 0);
  expect(mobileScroll?.scrollTop).toBeGreaterThan(0);
  await expect(page.getByRole('navigation', { name: '后台导航' })).toBeVisible();

  await page.getByRole('link', { name: '用户' }).click();
  await expect(page.getByRole('heading', { name: '用户活跃' })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();

  await page.getByRole('link', { name: '对局', exact: true }).click();
  await expect(page.getByRole('heading', { name: '对局记录' })).toBeVisible();
  await expect(page.getByRole('region', { name: '历史对局列表' })).toBeVisible();
});
