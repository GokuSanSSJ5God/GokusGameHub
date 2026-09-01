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
    const actions = activeGame.locator('.mobile-game-actions');
    const actionsBox = await actions.boundingBox();
    expect(sectionBox).not.toBeNull();
    expect(controlsBox).not.toBeNull();
    expect(actionsBox).not.toBeNull();
    expect(controlsBox!.x).toBeGreaterThanOrEqual(sectionBox!.x);
    expect(controlsBox!.x + controlsBox!.width).toBeLessThanOrEqual(sectionBox!.x + sectionBox!.width + 1);
    expect(actionsBox!.x).toBeGreaterThanOrEqual(sectionBox!.x);
    expect(actionsBox!.x + actionsBox!.width).toBeLessThanOrEqual(sectionBox!.x + sectionBox!.width + 1);
    await expect(actions.getByRole('button', { name: /Nowa gra|New game|新しいゲーム/ })).toBeVisible();
    await expect(actions.getByRole('button', { name: /Wróć do gier|Back to games|ゲーム一覧へ/ })).toBeVisible();

    if (game.activeId === '#active-snake') {
      const directionButtons = await activeGame.locator('.touch-controls button:not(.pause)').all();
      const boxes = await Promise.all(directionButtons.map(button => button.boundingBox()));
      for (let first = 0; first < boxes.length; first++) {
        for (let second = first + 1; second < boxes.length; second++) {
          const a = boxes[first]!;
          const b = boxes[second]!;
          const overlaps = a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
          expect(overlaps).toBe(false);
        }
      }
    }
  });
}
