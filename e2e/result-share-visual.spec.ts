import { expect, test, type Page, type TestInfo } from '@playwright/test';

type VisualGameType = 'splendor' | 'quoridor' | 'fugitive' | 'loveletter';

test.skip(
  process.env.PLAYWRIGHT_PRODUCTION === '1',
  'Visual fixtures import source modules from the local Vite server.',
);

test.skip(
  process.env.PLAYWRIGHT_PRODUCTION === '1',
  'Visual fixtures import source modules from the local Vite server.',
);

interface VisualCase {
  gameType: VisualGameType;
  family: 'commerce' | 'abstract' | 'deduction' | 'festival';
  playerCount: number;
}

const visualCases: VisualCase[] = [
  { gameType: 'splendor', family: 'commerce', playerCount: 10 },
  { gameType: 'quoridor', family: 'abstract', playerCount: 2 },
  { gameType: 'fugitive', family: 'deduction', playerCount: 2 },
  { gameType: 'loveletter', family: 'festival', playerCount: 6 },
];

async function renderResultCard(page: Page, visualCase: VisualCase) {
  await page.goto('/');
  await page.evaluate(async ({ gameType, playerCount }) => {
    document.body.innerHTML = '<main id="result-card-test-root"></main>';
    document.body.style.margin = '0';
    document.body.style.background = '#c9c5bc';
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { ResultCard } = await import(
      '/src/features/game-core/result-share/ResultCard.tsx'
    );
    const players = Array.from({ length: playerCount }, (_, index) => ({
      displayName: index === playerCount - 1
        ? '一位昵称非常非常长的 AI 玩家'
        : index === 0 ? 'N次元' : `收藏家 ${index + 1}`,
      seatIndex: index,
      isAI: index === playerCount - 1,
      finalScore: 17 - index,
      finalStocks: gameType === 'quoridor' ? 10 - index : 0,
      finalRank: index + 1,
      isWinner: index === 0,
      gameRole: gameType === 'quoridor'
        ? index === 0 ? 'south' : 'north'
        : gameType === 'fugitive'
          ? index === 0 ? 'fugitive' : 'marshal'
          : undefined,
      isSelf: index === 0,
    }));
    const model = {
      gameType,
      startedAt: '2026-11-02T10:00:00Z',
      endedAt: '2026-11-02T10:24:05Z',
      durationSeconds: 1445,
      players,
      self: players[0],
      outcome: 'win' as const,
      winnerCount: 1,
    };
    createRoot(document.querySelector('#result-card-test-root')!).render(
      React.createElement(ResultCard, { model }),
    );
    await document.fonts.ready;
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }, visualCase);
  await page.locator('[data-result-card]').waitFor();
}

for (const visualCase of visualCases) {
  test(`${visualCase.gameType} renders a polished ${visualCase.family} result poster`, async ({
    page,
  }, testInfo: TestInfo) => {
    await page.setViewportSize({ width: 1000, height: 900 });
    await renderResultCard(page, visualCase);

    const card = page.locator('[data-result-card]');
    await expect(card).toHaveAttribute('data-result-family', visualCase.family);
    await expect(card).toHaveAttribute('data-result-game', visualCase.gameType);
    await expect(card.locator('[data-qr-value] svg')).toBeVisible();
    await expect(card.locator('[data-result-motif]')).toBeVisible();
    await expect(card).toContainText(`${visualCase.playerCount} 位玩家`);

    const geometry = await card.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      const standings = element.querySelector<HTMLElement>('[data-result-standings]');
      const header = standings?.querySelector<HTMLElement>(':scope > header');
      const content = standings?.querySelector<HTMLElement>(':scope > div');
      const headerBounds = header?.getBoundingClientRect();
      const contentBounds = content?.getBoundingClientRect();
      return {
        width: bounds.width,
        height: bounds.height,
        overflowX: element.scrollWidth - element.clientWidth,
        overflowY: element.scrollHeight - element.clientHeight,
        standingsOverlap: headerBounds && contentBounds
          ? headerBounds.bottom - contentBounds.top
          : 0,
        artworkReady: Array.from(element.querySelectorAll('img'))
          .every(image => image.complete && image.naturalWidth > 0),
      };
    });
    expect(geometry).toMatchObject({
      width: 540,
      height: 720,
      overflowX: 0,
      overflowY: 0,
      artworkReady: true,
    });
    expect(geometry.standingsOverlap).toBeLessThanOrEqual(0);

    const screenshot = await card.screenshot({
      path: testInfo.outputPath(`${visualCase.gameType}-result-card.png`),
      scale: 'css',
    });
    expect(screenshot.byteLength).toBeGreaterThan(20_000);
  });
}
