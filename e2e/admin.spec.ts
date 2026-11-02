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
  await page.route('**/pam-api/platform/admin/analytics/overview', route => route.fulfill({
    json: {
      status_code: 200,
      message: 'ok',
      data: {
        window: windowData,
        metrics: {
          total_users: '1280',
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
          completion_rate: 0.871,
          game_duration_seconds: '972000',
          player_duration_seconds: '1728000',
          average_game_duration_seconds: '1200',
          average_player_duration_seconds: '2400',
        },
        daily: Array.from({ length: 30 }, (_, index) => ({
          date: dateAt(index),
          new_users: String(3 + index % 7),
          active_users: String(35 + index * 2),
          games_started: String(20 + index),
          games_completed: String(18 + index),
          game_duration_seconds: String(12000 + index * 600),
          player_duration_seconds: String(22000 + index * 900),
        })),
      },
    },
  }));
  await page.route('**/pam-api/platform/admin/analytics/users?*', route => route.fulfill({
    json: {
      status_code: 200,
      message: 'ok',
      data: {
        window: windowData,
        page: 1,
        page_size: 20,
        total: '2',
        users: [
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
        ],
      },
    },
  }));
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
  await page.route('**/pam-api/platform/admin/analytics/games', route => route.fulfill({
    json: {
      status_code: 200,
      message: 'ok',
      data: {
        window: windowData,
        games: [{
          game_type: 'splendor',
          active_users: '120',
          games_started: '260',
          games_completed: '240',
          completion_rate: 0.923,
          game_duration_seconds: '288000',
          player_duration_seconds: '576000',
          average_game_duration_seconds: '1200',
          average_human_players: 2.4,
        }],
      },
    },
  }));
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
        }],
      },
    },
  }));
}

test.beforeEach(async ({ page }) => {
  await mockAdminAPI(page);
});

test('admin analytics routes render and preserve duration semantics', async ({ page }) => {
  const assertClean = observePage(page);
  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: '数据总览' })).toBeVisible();
  await expect(page.getByText('用户增长与活跃')).toBeVisible();
  await expect(page.getByText('对局活跃时长（估算）')).toBeVisible();
  await expect(page.getByText('在线时长', { exact: true })).toHaveCount(0);
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
  await page.getByRole('link', { name: /北海玩家/ }).click();
  await expect(page.getByRole('heading', { name: '用户详情' })).toBeVisible();
  await expect(page.getByText('游戏偏好')).toBeVisible();

  await page.getByRole('link', { name: '游戏', exact: true }).click();
  await expect(page.getByRole('heading', { name: '游戏分析' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: '游戏活跃分析' }).getByText('璀璨宝石'),
  ).toBeVisible();

  await page.getByRole('link', { name: '实时' }).click();
  await expect(page.getByRole('heading', { name: '实时概况' })).toBeVisible();
  await expect(page.getByText('SP-1042')).toBeVisible();
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
});
