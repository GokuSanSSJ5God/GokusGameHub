import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, ViewChild, inject, output, signal } from '@angular/core';
import Phaser from 'phaser';
import { I18nService, TranslationKey } from '../../services/i18n.service';

interface Point { x: number; y: number; }
const GRID = 20;
const CELL = 20;

class SnakeScene extends Phaser.Scene {
  private snake: Point[] = [];
  private food: Point = { x: 0, y: 0 };
  private direction: Point = { x: 1, y: 0 };
  private queuedDirection: Point = { x: 1, y: 0 };
  private graphics!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private score = 0;
  private moveAt = 0;
  private moveDelay = 140;
  private ended = false;
  private paused = false;

  constructor(private readonly translate: (key: TranslationKey) => string, private readonly pauseChanged: (paused: boolean) => void) { super('snake'); }

  create(): void {
    this.graphics = this.add.graphics();
    this.scoreText = this.add.text(12, 12, '', { color: '#86efac', fontFamily: 'system-ui', fontSize: '15px', fontStyle: 'bold', lineSpacing: 4 }).setDepth(2);
    this.statusText = this.add.text(200, 200, '', { align: 'center', color: '#ffffff', fontFamily: 'system-ui', fontSize: '26px', fontStyle: 'bold' }).setOrigin(0.5).setDepth(2);
    const keyboard = this.input.keyboard;
    keyboard?.addCapture([Phaser.Input.Keyboard.KeyCodes.LEFT, Phaser.Input.Keyboard.KeyCodes.RIGHT, Phaser.Input.Keyboard.KeyCodes.UP, Phaser.Input.Keyboard.KeyCodes.DOWN, Phaser.Input.Keyboard.KeyCodes.SPACE]);
    keyboard?.on('keydown-LEFT', () => this.turn('left')); keyboard?.on('keydown-A', () => this.turn('left'));
    keyboard?.on('keydown-RIGHT', () => this.turn('right')); keyboard?.on('keydown-D', () => this.turn('right'));
    keyboard?.on('keydown-UP', () => this.turn('up')); keyboard?.on('keydown-W', () => this.turn('up'));
    keyboard?.on('keydown-DOWN', () => this.turn('down')); keyboard?.on('keydown-S', () => this.turn('down'));
    keyboard?.on('keydown-R', () => this.restart()); keyboard?.on('keydown-SPACE', () => { if (this.ended) this.restart(); });
    keyboard?.on('keydown-P', () => this.togglePause()); keyboard?.on('keydown-ESC', () => this.togglePause());
    this.restart();
  }

  override update(time: number): void {
    if (!this.ended && !this.paused && time >= this.moveAt) { this.moveAt = time + this.moveDelay; this.move(); }
  }

  turn(target: 'left' | 'right' | 'up' | 'down'): void {
    if (this.ended || this.paused) return;
    const directions = { left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 } };
    const candidate = directions[target];
    if (candidate.x !== -this.direction.x || candidate.y !== -this.direction.y) this.queuedDirection = candidate;
  }

  restart(): void {
    this.snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
    this.direction = { x: 1, y: 0 }; this.queuedDirection = { x: 1, y: 0 };
    this.score = 0; this.moveDelay = 140; this.ended = false; this.paused = false; this.pauseChanged(false); this.statusText.setText('');
    this.placeFood(); this.updateScore(); this.draw();
  }

  togglePause(): boolean {
    if (this.ended) return this.paused;
    this.paused = !this.paused;
    this.statusText.setText(this.paused ? this.translate('paused') : '');
    this.pauseChanged(this.paused);
    return this.paused;
  }

  pauseIfRunning(): void { if (!this.ended && !this.paused) this.togglePause(); }

  private move(): void {
    this.direction = this.queuedDirection;
    const next = { x: this.snake[0].x + this.direction.x, y: this.snake[0].y + this.direction.y };
    const hitWall = next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID;
    const hitSelf = this.snake.some(segment => segment.x === next.x && segment.y === next.y);
    if (hitWall || hitSelf) { this.ended = true; this.statusText.setText(`${this.translate('gameOver')}\nR / SPACE — ${this.translate('restart')}`); return; }
    this.snake.unshift(next);
    if (next.x === this.food.x && next.y === this.food.y) {
      this.score += 10; this.moveDelay = Math.max(65, this.moveDelay - 3); this.placeFood(); this.updateScore();
    } else this.snake.pop();
    this.draw();
  }

  private placeFood(): void {
    const free: Point[] = [];
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) if (!this.snake.some(segment => segment.x === x && segment.y === y)) free.push({ x, y });
    this.food = free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 };
  }

  private draw(): void {
    this.graphics.clear().fillStyle(0x07130e, 1).fillRect(0, 0, 400, 400).lineStyle(1, 0xffffff, 0.025);
    for (let i = 0; i <= GRID; i++) { this.graphics.lineBetween(i * CELL, 0, i * CELL, 400); this.graphics.lineBetween(0, i * CELL, 400, i * CELL); }
    this.graphics.fillStyle(0xf43f5e, 1).fillCircle(this.food.x * CELL + 10, this.food.y * CELL + 10, 7).fillStyle(0xffffff, .5).fillCircle(this.food.x * CELL + 8, this.food.y * CELL + 8, 2);
    this.snake.forEach((segment, index) => this.graphics.fillStyle(index === 0 ? 0x86efac : 0x22c55e, 1).fillRoundedRect(segment.x * CELL + 1, segment.y * CELL + 1, CELL - 2, CELL - 2, 5));
  }

  private updateScore(): void { this.scoreText.setText(`${this.translate('score')}  ${this.score}\n${this.translate('length')}  ${this.snake.length}`); }
}

@Component({ selector: 'app-snake-game', templateUrl: './snake-game.html', styleUrl: './snake-game.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class SnakeGame implements AfterViewInit, OnDestroy {
  readonly closed = output<void>(); readonly ready = output<void>();
  @ViewChild('gameHost', { static: true }) private gameHost!: ElementRef<HTMLDivElement>;
  protected readonly i18n = inject(I18nService);
  protected readonly paused = signal(false);
  private game?: Phaser.Game; private scene?: SnakeScene;
  ngAfterViewInit(): void {
    this.scene = new SnakeScene(key => this.i18n.t(key), paused => this.paused.set(paused));
    this.game = new Phaser.Game({ type: Phaser.AUTO, parent: this.gameHost.nativeElement, width: 400, height: 450, backgroundColor: '#07130e', scene: this.scene, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH } });
    requestAnimationFrame(() => this.ready.emit());
  }
  control(action: 'left' | 'right' | 'up' | 'down' | 'pause' | 'restart'): void { if (action === 'restart') this.scene?.restart(); else if (action === 'pause') this.scene?.togglePause(); else this.scene?.turn(action); }
  @HostListener('document:visibilitychange')
  protected pauseWhenHidden(): void { if (document.hidden) this.scene?.pauseIfRunning(); }
  ngOnDestroy(): void { this.game?.destroy(true); }
}
