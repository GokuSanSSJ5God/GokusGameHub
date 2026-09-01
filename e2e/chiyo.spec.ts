import { expect, test } from '@playwright/test';

async function openChiyo(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript(() => {
    let state = 0x2f6e2b1;
    Math.random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  });
  await page.goto('/');
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  const card = page.locator('.game-card').filter({ hasText: "Chiyo's Flight" });
  await card.getByRole('button').click();
  await expect(page.locator('#active-chiyo canvas')).toBeVisible();
  await page.locator('#active-chiyo').evaluate(element => element.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(100);
}

test.describe("Chiyo's Flight", () => {
  test('arrow keys do not start the game and are captured once it is active', async ({ page }, testInfo) => {
    test.skip(Boolean(testInfo.project.use.hasTouch), 'Keyboard behavior is covered by desktop projects.');
    await openChiyo(page);

    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);
    const beforeFreeArrow = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(beforeFreeArrow);

    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
    const activeScrollY = await page.evaluate(() => window.scrollY);
    for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
      await page.keyboard.press(key);
    }
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.scrollY)).toBe(activeScrollY);
  });

  test('game layout fits inside the viewport', async ({ page }) => {
    await openChiyo(page);

    const section = await page.locator('.chiyo-section').boundingBox();
    const canvas = await page.locator('#active-chiyo canvas').boundingBox();
    const viewport = page.viewportSize();
    expect(section).not.toBeNull();
    expect(canvas).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(section!.x).toBeGreaterThanOrEqual(0);
    expect(section!.x + section!.width).toBeLessThanOrEqual(viewport!.width + 1);
    expect(canvas!.x).toBeGreaterThanOrEqual(section!.x);
    expect(canvas!.x + canvas!.width).toBeLessThanOrEqual(section!.x + section!.width + 1);
    if (test.info().project.use.hasTouch) {
      const host = await page.locator('#active-chiyo .game-host').boundingBox();
      const controls = await page.locator('#active-chiyo .mobile-controls').getByRole('button').all();
      for (const control of controls) {
        const box = await control.boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(host!.x);
        expect(box!.y).toBeGreaterThanOrEqual(host!.y);
        expect(box!.x + box!.width).toBeLessThanOrEqual(host!.x + host!.width + 1);
        expect(box!.y + box!.height).toBeLessThanOrEqual(host!.y + host!.height + 1);
      }
    }
  });

  test('mobile pause control pauses and resumes the game', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.use.hasTouch, 'Mobile controls are covered by touch projects.');
    await openChiyo(page);

    await page.getByRole('button', { name: /Wzleć|Flap|羽ばたく/ }).click();
    await page.getByRole('button', { name: /Pauza|Pause|一時停止/ }).click();
    await expect(page.getByRole('button', { name: /Wznów|Resume|再開/ })).toBeVisible();
    await page.getByRole('button', { name: /Wznów|Resume|再開/ }).click();
    await expect(page.getByRole('button', { name: /Pauza|Pause|一時停止/ })).toBeVisible();
  });

  test('visual layout matches the approved snapshot', async ({ page }) => {
    await openChiyo(page);

    await expect(page.locator('.chiyo-section')).toHaveScreenshot(['games', 'chiyo', 'section.png'], {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    });
  });
});
