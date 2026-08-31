import { describe, expect, it } from 'vitest';
import { TetrisEngine, TETRIS_COLS, TETRIS_ROWS } from './tetris-engine';

describe('TetrisEngine', () => {
  it('does not clear an incomplete line or award points', () => {
    const game = new TetrisEngine(() => 0);
    game.board[TETRIS_ROWS - 1] = [...Array(TETRIS_COLS - 1).fill(1), 0];
    expect(game.clearCompletedLines()).toBe(0);
    expect(game.score).toBe(0);
  });

  it('clears only a complete line and awards 100 points', () => {
    const game = new TetrisEngine(() => 0);
    game.board[TETRIS_ROWS - 1] = Array(TETRIS_COLS).fill(1);
    expect(game.clearCompletedLines()).toBe(1);
    expect(game.score).toBe(100);
    expect(game.lines).toBe(1);
    expect(game.board[0].every(cell => cell === 0)).toBe(true);
  });

  it('prevents a piece from crossing the left wall', () => {
    const game = new TetrisEngine(() => 0);
    game.spawnPiece([[1]]); game.pieceX = 0;
    expect(game.move(-1)).toBe(false);
    expect(game.pieceX).toBe(0);
  });
});
