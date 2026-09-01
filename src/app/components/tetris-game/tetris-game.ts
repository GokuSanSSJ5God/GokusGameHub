import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, ViewChild, inject, output, signal } from '@angular/core';
import Phaser from 'phaser';
import { I18nService, TranslationKey } from '../../services/i18n.service';

type Cell = number;
type Matrix = Cell[][];
type GameSpeed = 0.75 | 1 | 1.5;

const COLS = 10;
const ROWS = 20;
const BLOCK = 28;
const COLORS = [0x000000, 0x22d3ee, 0x3b82f6, 0xf97316, 0xfacc15, 0x22c55e, 0xa855f7, 0xef4444];
const PIECES: readonly Matrix[] = [
  [[1, 1, 1, 1]],
  [[2, 0, 0], [2, 2, 2]],
  [[0, 0, 3], [3, 3, 3]],
  [[4, 4], [4, 4]],
  [[0, 5, 5], [5, 5, 0]],
  [[0, 6, 0], [6, 6, 6]],
  [[7, 7, 0], [0, 7, 7]]
];

class TetrisScene extends Phaser.Scene {
  private board: Matrix = [];
  private piece: Matrix = [];
  private pieceX = 0;
  private pieceY = 0;
  private score = 0;
  private lines = 0;
  private dropAt = 0;
  private baseDropDelay = 650;
  private speed: GameSpeed = 1;
  private ended = false;
  private paused = false;
  private graphics!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;

  constructor(private readonly translate: (key: TranslationKey) => string, private readonly pauseChanged: (paused: boolean) => void) { super('tetris'); }

  preload(): void {
    this.load.image('tetris-background', 'assets/games/chiyo-tetris.jpg');
  }

  create(): void {
    const background = this.add.image(150, 284, 'tetris-background');
    const cropWidth = background.height * (COLS * BLOCK) / (ROWS * BLOCK);
    background
      .setCrop((background.width - cropWidth) / 2, 0, cropWidth, background.height)
      .setScale((ROWS * BLOCK) / background.height);
    this.graphics = this.add.graphics();
    this.scoreText = this.add.text(10, 568, '', { color: '#c4b5fd', fontFamily: 'system-ui', fontSize: '14px', fontStyle: 'bold' });
    this.statusText = this.add.text(150, 280, '', { align: 'center', color: '#ffffff', fontFamily: 'system-ui', fontSize: '25px', fontStyle: 'bold' }).setOrigin(0.5).setDepth(2);

    const keyboard = this.input.keyboard;
    keyboard?.addCapture([
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.SPACE
    ]);
    keyboard?.on('keydown-LEFT', () => this.move(-1));
    keyboard?.on('keydown-A', () => this.move(-1));
    keyboard?.on('keydown-RIGHT', () => this.move(1));
    keyboard?.on('keydown-D', () => this.move(1));
    keyboard?.on('keydown-DOWN', () => this.softDrop());
    keyboard?.on('keydown-S', () => this.softDrop());
    keyboard?.on('keydown-UP', () => this.rotate());
    keyboard?.on('keydown-W', () => this.rotate());
    keyboard?.on('keydown-SPACE', () => this.hardDrop());
    keyboard?.on('keydown-R', () => this.restart());
    keyboard?.on('keydown-P', () => this.togglePause());
    keyboard?.on('keydown-ESC', () => this.togglePause());
    this.restart();
  }

  override update(time: number): void {
    if (!this.ended && !this.paused && time >= this.dropAt) {
      this.stepDown();
      this.dropAt = time + this.baseDropDelay / this.speed;
    }
  }

  move(direction: number): void {
    if (!this.ended && !this.paused && !this.collides(this.piece, this.pieceX + direction, this.pieceY)) {
      this.pieceX += direction;
      this.draw();
    }
  }

  rotate(): void {
    if (this.ended || this.paused) return;
    const rotated = this.piece[0].map((_, index) => this.piece.map(row => row[index]).reverse());
    for (const offset of [0, -1, 1, -2, 2]) {
      if (!this.collides(rotated, this.pieceX + offset, this.pieceY)) {
        this.piece = rotated;
        this.pieceX += offset;
        this.draw();
        return;
      }
    }
  }

  softDrop(): void {
    if (!this.ended && !this.paused) {
      this.stepDown();
    }
  }

  hardDrop(): void {
    if (this.ended || this.paused) return;
    while (!this.collides(this.piece, this.pieceX, this.pieceY + 1)) {
      this.pieceY++;
    }
    this.lockPiece();
  }

  restart(): void {
    this.board = Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0));
    this.score = 0;
    this.lines = 0;
    this.baseDropDelay = 650;
    this.ended = false;
    this.paused = false;
    this.pauseChanged(false);
    this.statusText.setText('');
    this.spawnPiece();
    this.updateLabels();
    this.draw();
  }

  togglePause(): boolean {
    if (this.ended) return this.paused;
    this.paused = !this.paused;
    this.statusText.setText(this.paused ? this.translate('paused') : '');
    this.pauseChanged(this.paused);
    return this.paused;
  }

  pauseIfRunning(): void { if (!this.ended && !this.paused) this.togglePause(); }

  setSpeed(speed: GameSpeed): void {
    this.speed = speed;
    this.dropAt = this.time.now + this.baseDropDelay / this.speed;
  }

  private stepDown(): boolean {
    if (!this.collides(this.piece, this.pieceX, this.pieceY + 1)) {
      this.pieceY++;
      this.draw();
      return true;
    }
    this.lockPiece();
    return false;
  }

  private lockPiece(): void {
    this.piece.forEach((row, y) => row.forEach((cell, x) => {
      if (cell && this.pieceY + y >= 0) this.board[this.pieceY + y][this.pieceX + x] = cell;
    }));
    this.clearLines();
    this.spawnPiece();
    this.updateLabels();
    this.draw();
  }

  private spawnPiece(): void {
    this.piece = PIECES[Math.floor(Math.random() * PIECES.length)].map(row => [...row]);
    this.pieceX = Math.floor((COLS - this.piece[0].length) / 2);
    this.pieceY = 0;
    if (this.collides(this.piece, this.pieceX, this.pieceY)) {
      this.ended = true;
      this.statusText.setText(`${this.translate('gameOver')}\nR — ${this.translate('restart')}`);
    }
  }

  private clearLines(): void {
    const remainingRows = this.board.filter(row => row.length === COLS && row.filter(cell => cell !== 0).length !== COLS);
    const cleared = ROWS - remainingRows.length;

    if (cleared) {
      const emptyRows = Array.from({ length: cleared }, () => Array<Cell>(COLS).fill(0));
      this.board = [...emptyRows, ...remainingRows];
      this.lines += cleared;
      this.score += [0, 100, 300, 500, 800][cleared];
      this.baseDropDelay = Math.max(120, 650 - this.lines * 15);
    }
  }

  private collides(matrix: Matrix, targetX: number, targetY: number): boolean {
    return matrix.some((row, y) => row.some((cell, x) => {
      if (!cell) return false;
      const boardX = targetX + x;
      const boardY = targetY + y;
      return boardX < 0 || boardX >= COLS || boardY >= ROWS || (boardY >= 0 && Boolean(this.board[boardY][boardX]));
    }));
  }

  private draw(): void {
    this.graphics.clear();
    this.graphics.fillStyle(0x090e1b, 0.72).fillRect(10, 4, COLS * BLOCK, ROWS * BLOCK);
    this.graphics.fillStyle(0x090e1b, 0.88).fillRect(0, 564, 300, 36);
    this.graphics.lineStyle(1, 0xffffff, 0.16);
    for (let x = 0; x <= COLS; x++) this.graphics.lineBetween(10 + x * BLOCK, 4, 10 + x * BLOCK, 4 + ROWS * BLOCK);
    for (let y = 0; y <= ROWS; y++) this.graphics.lineBetween(10, 4 + y * BLOCK, 10 + COLS * BLOCK, 4 + y * BLOCK);
    this.board.forEach((row, y) => row.forEach((cell, x) => this.drawCell(cell, x, y)));
    if (!this.ended) this.piece.forEach((row, y) => row.forEach((cell, x) => this.drawCell(cell, this.pieceX + x, this.pieceY + y)));
  }

  private drawCell(cell: Cell, x: number, y: number): void {
    if (!cell || y < 0) return;
    const px = 11 + x * BLOCK;
    const py = 5 + y * BLOCK;
    this.graphics.fillStyle(COLORS[cell], 1).fillRoundedRect(px, py, BLOCK - 2, BLOCK - 2, 4);
    this.graphics.fillStyle(0xffffff, 0.18).fillRoundedRect(px + 3, py + 3, BLOCK - 8, 5, 2);
  }

  private updateLabels(): void { this.scoreText.setText(`${this.translate('score')}  ${this.score}     ${this.translate('lines')}  ${this.lines}`); }
}

@Component({
  selector: 'app-tetris-game',
  templateUrl: './tetris-game.html',
  styleUrl: './tetris-game.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TetrisGame implements AfterViewInit, OnDestroy {
  readonly closed = output<void>();
  readonly ready = output<void>();
  @ViewChild('gameHost', { static: true }) private gameHost!: ElementRef<HTMLDivElement>;
  protected readonly i18n = inject(I18nService);
  protected readonly paused = signal(false);
  protected readonly speed = signal<GameSpeed>(1);
  protected readonly speedOptions: readonly GameSpeed[] = [0.75, 1, 1.5];
  private game?: Phaser.Game;
  private scene?: TetrisScene;

  ngAfterViewInit(): void {
    this.scene = new TetrisScene(key => this.i18n.t(key), paused => this.paused.set(paused));
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: this.gameHost.nativeElement,
      width: 300,
      height: 600,
      backgroundColor: '#090e1b',
      scene: this.scene,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
    });
    requestAnimationFrame(() => this.ready.emit());
  }

  control(action: 'left' | 'right' | 'rotate' | 'down' | 'drop' | 'pause' | 'restart'): void {
    if (action === 'left') this.scene?.move(-1);
    if (action === 'right') this.scene?.move(1);
    if (action === 'rotate') this.scene?.rotate();
    if (action === 'down') this.scene?.softDrop();
    if (action === 'drop') this.scene?.hardDrop();
    if (action === 'pause') this.scene?.togglePause();
    if (action === 'restart') this.scene?.restart();
  }

  setSpeed(speed: GameSpeed): void {
    this.speed.set(speed);
    this.scene?.setSpeed(speed);
  }

  @HostListener('document:visibilitychange')
  protected pauseWhenHidden(): void { if (document.hidden) this.scene?.pauseIfRunning(); }

  ngOnDestroy(): void { this.game?.destroy(true); }
}
