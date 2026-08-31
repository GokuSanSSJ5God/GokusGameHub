import { describe, expect, it } from 'vitest';
import { SnakeEngine } from './snake-engine';

describe('SnakeEngine', () => {
  it('grows and awards points after eating', () => {
    const game = new SnakeEngine(20, () => 0);
    game.setFood({ x: 11, y: 10 });
    expect(game.step()).toBe(true);
    expect(game.snake).toHaveLength(4);
    expect(game.score).toBe(10);
  });

  it('does not allow an immediate reverse turn', () => {
    const game = new SnakeEngine();
    expect(game.turn('left')).toBe(false);
    expect(game.step()).toBe(true);
    expect(game.snake[0]).toEqual({ x: 11, y: 10 });
  });

  it('ends the game after hitting a wall', () => {
    const game = new SnakeEngine(4, () => 0);
    game.step(); game.step();
    expect(game.step()).toBe(false);
    expect(game.ended).toBe(true);
  });

  it('never places food on the snake', () => {
    const game = new SnakeEngine(5, () => 0);
    expect(game.snake.some(segment => segment.x === game.food.x && segment.y === game.food.y)).toBe(false);
  });
});
