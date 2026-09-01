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

  it('increases level every 30 seconds of active flight', () => {
    const game = new ChiyoEngine(() => 0.9);
    expect(game.level).toBe(1);
    game.flightTime = 29.99;
    expect(game.level).toBe(1);
    game.flightTime = 30;
    expect(game.level).toBe(2);
    game.flightTime = 270;
    expect(game.level).toBe(10);
  });

  it('awards 100 bonus points for collecting an item', () => {
    const game = new ChiyoEngine(() => 0.9);
    game.items.push({ x: CHIYO_BIRD_X, y: game.birdY, collected: false, type: 'seed' });
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

  it('collects a shield and survives terrain while it is active', () => {
    const game = new ChiyoEngine(() => 0.9);
    game.birdY = 60;
    game.items.push({ x: CHIYO_BIRD_X, y: game.birdY, collected: false, type: 'shield' });
    game.flap();
    game.step(0.001);
    expect(game.invincible).toBe(true);
    expect(game.ended).toBe(false);
  });

  it('keeps invincible Chiyo inside the board', () => {
    const game = new ChiyoEngine(() => 0.9);
    game.items.push({ x: CHIYO_BIRD_X, y: game.birdY, collected: false, type: 'shield' });
    game.flap();
    game.step(0.001);
    game.birdY = 600;
    game.velocityY = 500;
    game.step(0.001);
    expect(game.birdY).toBe(485);
    expect(game.ended).toBe(false);
  });

  it('ends invincibility after five seconds of active play', () => {
    const game = new ChiyoEngine(() => 0.9);
    game.items.push({ x: CHIYO_BIRD_X, y: game.birdY, collected: false, type: 'shield' });
    game.flap();
    game.step(0.001);
    for (let frame = 0; frame < 144; frame++) {
      game.birdY = 250;
      game.velocityY = 0;
      game.step(0.035);
    }
    expect(game.invincible).toBe(false);
  });

  it('collects a speed power-down and moves faster for five seconds', () => {
    const game = new ChiyoEngine(() => 0.9);
    game.items.push({ x: CHIYO_BIRD_X, y: game.birdY, collected: false, type: 'speed' });
    game.flap();
    game.step(0.001);
    game.step(0.001);
    expect(game.speedBoosted).toBe(true);
    expect(game.speed).toBeGreaterThan(280);
    for (let frame = 0; frame < 144; frame++) {
      game.birdY = 250;
      game.velocityY = 0;
      game.step(0.035);
    }
    expect(game.speedBoosted).toBe(false);
  });

  it('collects a glide power-up and keeps a straight altitude for three seconds', () => {
    const game = new ChiyoEngine(() => 0.9);
    game.items.push({ x: CHIYO_BIRD_X, y: game.birdY, collected: false, type: 'glide' });
    game.flap();
    game.step(0.001);
    const lockedY = game.birdY;
    for (let frame = 0; frame < 80; frame++) {
      game.terrain.forEach(slice => { slice.top = 0; slice.bottom = 0; });
      game.step(0.035);
    }
    expect(game.gliding).toBe(true);
    expect(game.birdY).toBe(lockedY);
    for (let frame = 0; frame < 6; frame++) {
      game.terrain.forEach(slice => { slice.top = 0; slice.bottom = 0; });
      game.step(0.035);
    }
    expect(game.gliding).toBe(false);
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
    const snapshot = { birdY: game.birdY, distance: game.distance, flightTime: game.flightTime, score: game.score };
    game.step(1);
    expect({ birdY: game.birdY, distance: game.distance, flightTime: game.flightTime, score: game.score }).toEqual(snapshot);
    expect(game.paused).toBe(true);
  });
});
