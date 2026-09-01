export type TetrisMatrix = number[][];

export const TETRIS_COLS = 10;
export const TETRIS_ROWS = 20;
export const TETRIS_PIECES: readonly TetrisMatrix[] = [
  [[1, 1, 1, 1]], [[2, 0, 0], [2, 2, 2]], [[0, 0, 3], [3, 3, 3]],
  [[4, 4], [4, 4]], [[0, 5, 5], [5, 5, 0]], [[0, 6, 0], [6, 6, 6]], [[7, 7, 0], [0, 7, 7]]
];

export class TetrisEngine {
  board: TetrisMatrix = [];
  piece: TetrisMatrix = [];
  pieceX = 0;
  pieceY = 0;
  score = 0;
  lines = 0;
  ended = false;

  constructor(private readonly random: () => number = Math.random) { this.restart(); }

  restart(): void {
    this.board = Array.from({ length: TETRIS_ROWS }, () => Array<number>(TETRIS_COLS).fill(0));
    this.score = 0; this.lines = 0; this.ended = false; this.spawnPiece();
  }

  spawnPiece(piece?: TetrisMatrix): void {
    const source = piece ?? TETRIS_PIECES[Math.floor(this.random() * TETRIS_PIECES.length)];
    this.piece = source.map(row => [...row]);
    this.pieceX = Math.floor((TETRIS_COLS - this.piece[0].length) / 2); this.pieceY = 0;
    this.ended = this.collides(this.piece, this.pieceX, this.pieceY);
  }

  move(direction: number): boolean {
    if (this.ended || this.collides(this.piece, this.pieceX + direction, this.pieceY)) {return false;}
    this.pieceX += direction; return true;
  }

  rotate(): boolean {
    if (this.ended) {return false;}
    const rotated = this.piece[0].map((_, index) => this.piece.map(row => row[index]).reverse());
    for (const offset of [0, -1, 1, -2, 2]) {if (!this.collides(rotated, this.pieceX + offset, this.pieceY)) {
      this.piece = rotated; this.pieceX += offset; return true;
    }}
    return false;
  }

  stepDown(): boolean {
    if (this.ended) {return false;}
    if (!this.collides(this.piece, this.pieceX, this.pieceY + 1)) { this.pieceY++; return true; }
    this.lockPiece(); return false;
  }

  hardDrop(): void {
    if (this.ended) {return;}
    while (!this.collides(this.piece, this.pieceX, this.pieceY + 1)) {this.pieceY++;}
    this.lockPiece();
  }

  clearCompletedLines(): number {
    const remaining = this.board.filter(row => row.length === TETRIS_COLS && row.some(cell => cell === 0));
    const cleared = TETRIS_ROWS - remaining.length;
    if (cleared > 0) {
      this.board = [...Array.from({ length: cleared }, () => Array<number>(TETRIS_COLS).fill(0)), ...remaining];
      this.lines += cleared; this.score += [0, 100, 300, 500, 800][cleared];
    }
    return cleared;
  }

  collides(matrix: TetrisMatrix, targetX: number, targetY: number): boolean {
    return matrix.some((row, y) => row.some((cell, x) => cell !== 0 && (
      targetX + x < 0 || targetX + x >= TETRIS_COLS || targetY + y >= TETRIS_ROWS ||
      (targetY + y >= 0 && this.board[targetY + y][targetX + x] !== 0)
    )));
  }

  private lockPiece(): void {
    this.piece.forEach((row, y) => row.forEach((cell, x) => { if (cell && this.pieceY + y >= 0) {this.board[this.pieceY + y][this.pieceX + x] = cell;} }));
    this.clearCompletedLines(); this.spawnPiece();
  }
}
