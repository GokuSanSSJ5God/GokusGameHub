import { expect, test } from '@playwright/test';

const availableGames = [
  { title: 'Blocks with Chiyo', activeId: '#active-game', snapshot: 'tetris.png' },
  { title: 'Neon Snake', activeId: '#active-snake', snapshot: 'snake.png' },
  { title: "Chiyo's Flight", activeId: '#active-chiyo', snapshot: 'chiyo.png' },
] as const;

async function disableSmoothScroll(page: import('@playwright/test').Page): Promise<void> {
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
}

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      let state = 0x2f6e2b1;
      Math.random = () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 0x100000000;
      };
    });
    await page.goto('/');
    await disableSmoothScroll(page);
  });

  test('browse games CTA scrolls to the games section', async ({ page }) => {
    const games = page.locator('#games');
    await page.getByRole('link', { name: /Przeglądaj gry|Browse games|ゲームを見る/ }).click();

    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('#games');
    await expect.poll(async () => {
      const box = await games.boundingBox();
      return box?.y ?? Number.POSITIVE_INFINITY;
    }).toBeGreaterThanOrEqual(-1);
    expect((await games.boundingBox())!.y).toBeLessThan(page.viewportSize()!.height);
  });

  for (const game of availableGames) {
    test(`selecting ${game.title} scrolls to the game and matches the visual snapshot`, async ({ page }) => {
      const card = page.locator('.game-card').filter({ hasText: game.title });
      await card.getByRole('button').click();

      const activeGame = page.locator(game.activeId);
      await expect(activeGame.locator('canvas')).toBeVisible();
      await expect.poll(async () => {
        const box = await activeGame.boundingBox();
        return box?.y ?? Number.POSITIVE_INFINITY;
      }).toBeLessThan(page.viewportSize()!.height);
      expect((await activeGame.boundingBox())!.y).toBeGreaterThanOrEqual(-1);

      if (game.activeId !== '#active-chiyo') await page.keyboard.press('P');
      await expect(page).toHaveScreenshot(['pages', 'home', 'game-navigation', game.snapshot], {
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: 0.01,
      });
    });
  }

  test('page has no horizontal overflow', async ({ page }) => {
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });

  test('visual scroll journey matches the approved snapshots', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot(['pages', 'home', 'steps', '01-hero.png'], {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    });

    await page.getByRole('link', { name: /Przeglądaj gry|Browse games|ゲームを見る/ }).click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('#games');
    await expect(page).toHaveScreenshot(['pages', 'home', 'steps', '02-games.png'], {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    });

    await page.locator('#about').evaluate(element => element.scrollIntoView({ block: 'start' }));
    await expect(page).toHaveScreenshot(['pages', 'home', 'steps', '03-about.png'], {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    });

    await page.locator('app-footer').evaluate(element => element.scrollIntoView({ block: 'end' }));
    await expect(page).toHaveScreenshot(['pages', 'home', 'steps', '04-footer.png'], {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    });
  });
});
