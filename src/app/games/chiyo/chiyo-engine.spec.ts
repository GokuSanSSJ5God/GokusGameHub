import { describe, expect, it } from 'vitest';
import { CHIYO_BIRD_X, ChiyoEngine } from './chiyo-engine';

describe('ChiyoEngine', () => {
  it('starts inside a wide and safe corridor', () => {
    const game = new ChiyoEngine(() => 0.9);
    const start = game.terrain.find(slice => CHIYO_BIRD_X >= slice.x && CHIYO_BIRD_X < slice.x + 45);
    expect(start).toMatchObject({ top: 55, bottom: 55 });
    expect(game.ended).toBe(false);
  });

  it('does not lose immediately after the first flap', () => {
    const game = new ChiyoEngine(() => 0.9);
    game.flap();
    for (let frame = 0; frame < 20; frame++) {game.step(1 / 60);}
    expect(game.started).toBe(true);
    expect(game.ended).toBe(false);
  });

  it('uses a wider procedural corridor after the safe opening', () => {
    const game = new ChiyoEngine(() => 0.9);
    const proceduralTerrain = game.terrain.slice(11);
    expect(proceduralTerrain.length).toBeGreaterThan(0);
    expect(proceduralTerrain.every(slice => 500 - slice.top - slice.bottom >= 280)).toBe(true);
  });

  it('awards distance points while flying', () => {
    const game = new ChiyoEngine(() => 0.9);
    game.flap();
    for (let frame = 0; frame < 10; frame++) {game.step(1 / 60);}
    expect(game.distance).toBeGreaterThan(0);
    expect(game.score).toBeGreaterThan(0);
  });

  it('awards 100 bonus points for collecting an item', () => {
    const game = new ChiyoEngine(() => 0.9);
    game.items.push({ x: CHIYO_BIRD_X, y: game.birdY, collected: false });
    game.flap();
    game.step(0.001);
    expect(game.itemScore).toBe(100);
    expect(game.collectedItems).toBe(1);
  });

  it('ends the game when Chiyo touches the terrain', () => {
    const game = new ChiyoEngine(() => 0.9);
    game.birdY = 60;
    game.flap();
    game.step(0.001);
    expect(game.ended).toBe(true);
  });

  it('restart restores the initial state', () => {
    const game = new ChiyoEngine(() => 0.9);
    game.flap(); game.step(0.02); game.restart();
    expect(game.birdY).toBe(250);
    expect(game.score).toBe(0);
    expect(game.started).toBe(false);
    expect(game.ended).toBe(false);
  });

  it('stops physics, distance and scoring while paused', () => {
    const game = new ChiyoEngine(() => 0.9);
    game.flap(); game.step(0.02); game.togglePause();
    const snapshot = { birdY: game.birdY, distance: game.distance, score: game.score };
    game.step(1);
    expect({ birdY: game.birdY, distance: game.distance, score: game.score }).toEqual(snapshot);
    expect(game.paused).toBe(true);
  });
});
