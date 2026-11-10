import { expect, test } from '@playwright/test';

const options = [
  { value: 'friend', label: '朋友推荐' },
  { value: 'wechat_qq', label: '微信群 / QQ 群' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'bilibili', label: '哔哩哔哩' },
  { value: 'douyin', label: '抖音' },
  { value: 'search_engine', label: '搜索引擎' },
  { value: 'board_game_community', label: '桌游社区 / 论坛' },
  { value: 'other', label: '其他' },
];

test('player can submit the global acquisition survey', async ({ page }) => {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 200,
      message: 'ok',
      data: {
        user_id: '30',
        display_name: '并购玩家',
        roles: ['player'],
      },
    },
  }));
  await page.route('**/pam-api/platform/auth/acquisition-survey', async route => {
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON()).toEqual({
        source: 'other',
        other_detail: '线下桌游店',
      });
      return route.fulfill({
        json: {
          status_code: 200,
          message: 'ok',
          data: {
            completed: true,
            source: 'other',
            other_detail: '线下桌游店',
            submitted_at_unix: '1794300000',
            options,
          },
        },
      });
    }
    return route.fulfill({
      json: {
        status_code: 200,
        message: 'ok',
        data: { completed: false, options },
      },
    });
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const dialog = page.getByRole('dialog', {
    name: '你是从哪里知道 GameBus 的？',
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('radio')).toHaveCount(8);
  await expect(dialog.getByRole('button', { name: '关闭面板' })).toHaveCount(0);
  const submit = dialog.getByRole('button', { name: '提交' });
  await expect(submit).toBeDisabled();

  const otherOption = dialog.getByRole('radio', { name: '其他' });
  await dialog.getByText('其他', { exact: true }).click();
  await expect(otherOption).toBeChecked();
  await expect(submit).toBeDisabled();
  await dialog.getByRole('textbox', { name: '请补充说明' }).fill('线下桌游店');
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(dialog).toBeHidden();
});
