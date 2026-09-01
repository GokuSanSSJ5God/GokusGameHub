import { expect, test } from '@playwright/test';

const games = [
  { title: 'Blocks with Chiyo', activeId: '#active-game', section: '.tetris-section' },
  { title: 'Neon Snake', activeId: '#active-snake', section: '.snake-section' },
] as const;

for (const game of games) {
  test(`${game.title} keeps controls and actions inside the mobile game card`, async ({ page }, testInfo) => {
    test.skip(!testInfo.project.use.hasTouch, 'Mobile controls are covered by touch projects.');
    await page.goto('/');
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

    const card = page.locator('.game-card').filter({ hasText: game.title });
    await card.getByRole('button').click();
    const activeGame = page.locator(game.activeId);
    await expect(activeGame.locator('canvas')).toBeVisible();

    const sectionBox = await activeGame.locator(game.section).boundingBox();
    const controlsBox = await activeGame.locator('.touch-controls').boundingBox();
    const closeButton = activeGame.getByRole('button', { name: /Wróć do gier|Back to games|ゲーム一覧へ/ });
    const restartButton = activeGame.getByRole('button', { name: /Nowa gra|New game|新しいゲーム/ });
    const closeBox = await closeButton.boundingBox();
    const restartBox = await restartButton.boundingBox();
    expect(sectionBox).not.toBeNull();
    expect(controlsBox).not.toBeNull();
    expect(closeBox).not.toBeNull();
    expect(restartBox).not.toBeNull();
    expect(controlsBox!.x).toBeGreaterThanOrEqual(sectionBox!.x);
    expect(controlsBox!.x + controlsBox!.width).toBeLessThanOrEqual(sectionBox!.x + sectionBox!.width + 1);
    expect(closeBox!.x).toBeGreaterThanOrEqual(sectionBox!.x);
    expect(closeBox!.x + closeBox!.width).toBeLessThanOrEqual(sectionBox!.x + sectionBox!.width + 1);
    expect(restartBox!.x).toBeGreaterThanOrEqual(sectionBox!.x);
    expect(restartBox!.x + restartBox!.width).toBeLessThanOrEqual(sectionBox!.x + sectionBox!.width + 1);
    await expect(closeButton).toBeVisible();
    await expect(restartButton).toBeVisible();

    if (game.activeId === '#active-snake') {
      await page.waitForTimeout(500);
      const directionButtons = await activeGame.locator('.touch-controls button:not(.pause)').all();
      const boxes = await Promise.all(directionButtons.map(async button => ({
        label: await button.getAttribute('aria-label'),
        box: await button.boundingBox(),
      })));
      for (let first = 0; first < boxes.length; first++) {
        for (let second = first + 1; second < boxes.length; second++) {
          const a = boxes[first]!.box!;
          const b = boxes[second]!.box!;
          const overlaps = a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
          expect(overlaps, `${boxes[first]!.label} ${JSON.stringify(a)} overlaps ${boxes[second]!.label} ${JSON.stringify(b)}`).toBe(false);
        }
      }
    }
  });
}
