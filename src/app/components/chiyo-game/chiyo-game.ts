import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, ViewChild, inject, output, signal } from '@angular/core';
import Phaser from 'phaser';
import { CHIYO_BIRD_X, ChiyoEngine } from '../../games/chiyo/chiyo-engine';
import { GameAudioService, GameSoundEffect } from '../../services/game-audio.service';
import { I18nService, TranslationKey } from '../../services/i18n.service';

interface TerrainSlice { x: number; top: number; bottom: number; }
interface Collectible { x: number; y: number; collected: boolean; }

const WIDTH = 900;
const HEIGHT = 500;
const BIRD_X = 170;
const SLICE_WIDTH = 45;
const TERRAIN_LEVEL_COLORS = [0x14532d, 0x155e3a, 0x0f766e, 0x0d9488, 0x4d7c0f, 0x854d0e, 0x9a3412, 0xc2410c, 0xb91c1c, 0x7f1d1d];
const EDGE_LEVEL_COLORS = [0x22c55e, 0x34d399, 0x2dd4bf, 0x5eead4, 0xa3e635, 0xfacc15, 0xfb923c, 0xf97316, 0xef4444, 0xf87171];

class ChiyoScene extends Phaser.Scene {
  private readonly engine = new ChiyoEngine();
  private graphics!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private pauseText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private terrain: TerrainSlice[] = [];
  private items: Collectible[] = [];
  private birdY = 250;
  private velocityY = 0;
  private distance = 0;
  private itemScore = 0;
  private speed = 190;
  private ended = false;
  private started = false;
  private lastTime = 0;

  constructor(private readonly translate: (key: TranslationKey) => string, private readonly pauseChanged: (paused: boolean) => void, private readonly playSound: (effect: GameSoundEffect) => void) { super('chiyo-flight'); }

  create(): void {
    this.graphics = this.add.graphics();
    this.scoreText = this.add.text(18, 16, '', { color: '#fef08a', fontFamily: 'system-ui', fontSize: '20px', fontStyle: 'bold' }).setDepth(3);
    this.pauseText = this.add.text(WIDTH - 18, 18, `P / ESC — ${this.translate('pause')}`, { color: '#ffffff', fontFamily: 'system-ui', fontSize: '15px', fontStyle: 'bold' }).setOrigin(1, 0).setDepth(3);
    this.hintText = this.add.text(WIDTH / 2, HEIGHT / 2, '', { align: 'center', color: '#ffffff', fontFamily: 'system-ui', fontSize: '26px', fontStyle: 'bold' }).setOrigin(0.5).setDepth(3);
    this.input.on('pointerdown', () => this.flap());
    const keyboard = this.input.keyboard;
    keyboard?.on('keydown-SPACE', (event: KeyboardEvent) => this.handleFlapKey(event));
    keyboard?.on('keydown-UP', (event: KeyboardEvent) => this.preventGameplayScroll(event));
    keyboard?.on('keydown-DOWN', (event: KeyboardEvent) => this.preventGameplayScroll(event));
    keyboard?.on('keydown-LEFT', (event: KeyboardEvent) => this.preventGameplayScroll(event));
    keyboard?.on('keydown-RIGHT', (event: KeyboardEvent) => this.preventGameplayScroll(event));
    keyboard?.on('keydown-R', () => this.restart());
    keyboard?.on('keydown-P', () => this.togglePause());
    keyboard?.on('keydown-ESC', () => this.togglePause());
    this.restart();
  }

  private handleFlapKey(event: KeyboardEvent): void {
    event.preventDefault();
    this.flap();
  }

  private preventGameplayScroll(event: KeyboardEvent): void {
    if (this.engine.started && !this.engine.ended) {event.preventDefault();}
  }

  override update(time: number): void {
    const delta = Math.min((time - this.lastTime) / 1000, 0.035);
    this.lastTime = time;
    if (!this.engine.started || this.engine.ended || delta <= 0) {return;}
    const collectedItems = this.engine.collectedItems;
    const wasInvincible = this.engine.invincible;
    const wasSpeedBoosted = this.engine.speedBoosted;
    const wasGliding = this.engine.gliding;
    this.engine.step(delta);
    if (this.engine.collectedItems > collectedItems) {this.playSound('score');}
    if (!wasInvincible && this.engine.invincible) {this.playSound('score');}
    if (!wasSpeedBoosted && this.engine.speedBoosted) {this.playSound('drop');}
    if (!wasGliding && this.engine.gliding) {this.playSound('turn');}
    if (this.engine.ended) { this.playSound('gameOver'); this.hintText.setText(`${this.translate('gameOver')}\n${this.translate('score')} ${this.engine.score}\nClick / R — ${this.translate('restart')}`); }
    this.updateScore();
    this.draw();
  }

  flap(): void {
    if (this.engine.paused) {return;}
    if (this.engine.ended) { this.restart(); return; }
    this.engine.flap();
    this.playSound('flap');
    this.hintText.setText('');
  }

  togglePause(): boolean {
    const paused = this.engine.togglePause();
    this.pauseText.setText(`P / ESC — ${this.translate(paused ? 'resume' : 'pause')}`);
    if (paused) {this.hintText.setText(this.translate('paused'));}
    else if (this.engine.started && !this.engine.ended) {this.hintText.setText('');}
    this.pauseChanged(paused);
    return paused;
  }

  pauseIfRunning(): void {
    if (this.engine.started && !this.engine.ended && !this.engine.paused) {this.togglePause();}
  }

  restart(): void {
    this.engine.restart();
    this.pauseChanged(false);
    this.pauseText.setText(`P / ESC — ${this.translate('pause')}`);
    this.lastTime = this.time.now;
    this.hintText.setText(`CLICK / SPACE\n${this.translate('flyChiyo')}`);
    this.updateScore(); this.draw();
  }

  private moveWorld(amount: number): void {
    this.terrain.forEach(slice => slice.x -= amount);
    this.items.forEach(item => item.x -= amount);
    while (this.terrain[0].x < -SLICE_WIDTH) {
      this.terrain.shift();
      const last = this.terrain[this.terrain.length - 1];
      const next = this.createSlice(last.x + SLICE_WIDTH, Math.floor(this.distance / SLICE_WIDTH) + this.terrain.length);
      this.terrain.push(next);
      if (Math.random() < 0.22) {
        const minY = next.top + 48;
        const maxY = HEIGHT - next.bottom - 48;
        if (maxY > minY) {this.items.push({ x: next.x + SLICE_WIDTH / 2, y: Phaser.Math.Between(Math.ceil(minY), Math.floor(maxY)), collected: false });}
      }
    }
    this.items = this.items.filter(item => item.x > -30 && !item.collected);
  }

  private createSlice(x: number, index: number): TerrainSlice {
    // Keep the opening section wide and centered so the first flap can never
    // send Chiyo directly into procedurally generated terrain.
    if (this.distance === 0 && index < 11) {return { x, top: 55, bottom: 55 };}

    const wave = Math.sin(index * 0.42) * 55 + Math.sin(index * 0.13) * 30;
    const difficulty = Math.min(45, this.distance / 500);
    const gap = 245 - difficulty;
    const center = HEIGHT / 2 + wave;
    return { x, top: Phaser.Math.Clamp(center - gap / 2, 35, 205), bottom: Phaser.Math.Clamp(HEIGHT - (center + gap / 2), 35, 205) };
  }

  private checkCollisions(): void {
    const slice = this.terrain.find(current => BIRD_X >= current.x && BIRD_X < current.x + SLICE_WIDTH);
    const birdRadius = 15;
    if (!slice || this.birdY - birdRadius <= slice.top || this.birdY + birdRadius >= HEIGHT - slice.bottom) {
      this.gameOver(); return;
    }
    for (const item of this.items) {
      if (!item.collected && Phaser.Math.Distance.Between(BIRD_X, this.birdY, item.x, item.y) < 27) {
        item.collected = true; this.itemScore += 100;
      }
    }
  }

  private gameOver(): void {
    this.ended = true;
    this.hintText.setText(`GAME OVER\nSCORE ${this.totalScore()}\nClick / R — restart`);
  }

  private totalScore(): number { return this.engine.score; }
  private updateScore(): void {
    const shieldStatus = this.engine.invincible ? `     ${this.translate('shield')}  ${Math.ceil(this.engine.invincibilityRemaining)} s` : '';
    const speedStatus = this.engine.speedBoosted ? `     ${this.translate('speedUp')}  ${Math.ceil(this.engine.speedBoostRemaining)} s` : '';
    const glideStatus = this.engine.gliding ? `     ${this.translate('glide')}  ${Math.ceil(this.engine.glideRemaining)} s` : '';
    this.scoreText.setText(`${this.translate('score')}  ${this.engine.score}     ${this.translate('distance')}  ${Math.floor(this.engine.distance / 10)} m     ${this.translate('level')}  ${this.engine.level}     ${this.translate('items')}  ${this.engine.collectedItems}${shieldStatus}${speedStatus}${glideStatus}`);
  }

  private draw(): void {
    this.graphics.clear();
    this.graphics.fillGradientStyle(0x071b33, 0x071b33, 0x164e63, 0x164e63, 1).fillRect(0, 0, WIDTH, HEIGHT);
    this.drawClouds();
    const terrainColor = this.interpolateLevelColor(TERRAIN_LEVEL_COLORS);
    const edgeColor = this.interpolateLevelColor(EDGE_LEVEL_COLORS);
    this.engine.terrain.forEach(slice => {
      this.graphics.fillStyle(terrainColor, 1).fillRect(slice.x, 0, SLICE_WIDTH + 1, slice.top);
      this.graphics.fillStyle(edgeColor, 1).fillRect(slice.x, slice.top - 5, SLICE_WIDTH + 1, 7);
      this.graphics.fillStyle(terrainColor, 1).fillRect(slice.x, HEIGHT - slice.bottom, SLICE_WIDTH + 1, slice.bottom);
      this.graphics.fillStyle(edgeColor, 1).fillRect(slice.x, HEIGHT - slice.bottom, SLICE_WIDTH + 1, 7);
    });
    this.engine.items.forEach(item => {
      if (!item.collected) {
        if (item.type === 'shield') {this.drawShield(item.x, item.y);}
        else if (item.type === 'speed') {this.drawSpeedPowerDown(item.x, item.y);}
        else if (item.type === 'glide') {this.drawGlidePowerUp(item.x, item.y);}
        else {this.drawSeed(item.x, item.y);}
      }
    });
    this.drawBird();
  }

  private interpolateLevelColor(colors: readonly number[]): number {
    const startIndex = this.engine.level - 1;
    const endIndex = Math.min(colors.length - 1, startIndex + 1);
    const progress = this.engine.level === 10 ? 0 : (this.engine.flightTime % 30) / 30;
    const start = colors[startIndex];
    const end = colors[endIndex];
    const channel = (shift: number): number => Math.round(((start >> shift) & 0xff) + (((end >> shift) & 0xff) - ((start >> shift) & 0xff)) * progress);
    return (channel(16) << 16) | (channel(8) << 8) | channel(0);
  }

  private drawClouds(): void {
    const offset = -(this.engine.distance * .15) % 260;
    this.graphics.fillStyle(0xffffff, .08);
    for (let x = offset - 100; x < WIDTH + 100; x += 260) {
      this.graphics.fillCircle(x, 110, 35).fillCircle(x + 35, 105, 46).fillCircle(x + 75, 115, 30);
    }
  }

  private drawSeed(x: number, y: number): void {
    this.graphics.fillStyle(0xfacc15, .22).fillCircle(x, y, 17);
    this.graphics.fillStyle(0xfde047, 1).fillCircle(x, y, 8);
    this.graphics.fillStyle(0xffffff, .7).fillCircle(x - 3, y - 3, 2);
  }

  private drawShield(x: number, y: number): void {
    this.graphics.fillStyle(0x38bdf8, .22).fillCircle(x, y, 22);
    this.graphics.lineStyle(3, 0x7dd3fc, 1).strokeCircle(x, y, 13);
    this.graphics.fillStyle(0x0ea5e9, 1).fillTriangle(x, y + 15, x - 11, y - 7, x + 11, y - 7);
    this.graphics.fillStyle(0xffffff, .75).fillCircle(x - 4, y - 5, 3);
  }

  private drawSpeedPowerDown(x: number, y: number): void {
    this.graphics.fillStyle(0x000000, .35).fillCircle(x, y, 22);
    this.graphics.fillStyle(0x030712, 1).fillCircle(x, y, 14);
    this.graphics.lineStyle(3, 0x94a3b8, .9).strokeCircle(x, y, 14);
    this.graphics.fillStyle(0xffffff, .9).fillTriangle(x + 2, y - 11, x - 7, y + 2, x + 1, y + 1);
    this.graphics.fillStyle(0xffffff, .9).fillTriangle(x - 1, y + 11, x + 8, y - 2, x, y - 1);
  }

  private drawGlidePowerUp(x: number, y: number): void {
    this.graphics.fillStyle(0x22c55e, .22).fillCircle(x, y, 22);
    this.graphics.fillStyle(0x16a34a, 1).fillCircle(x, y, 14);
    this.graphics.lineStyle(3, 0x86efac, 1).strokeCircle(x, y, 14);
    this.graphics.lineStyle(3, 0xffffff, .9).lineBetween(x - 8, y, x + 8, y);
    this.graphics.fillStyle(0xffffff, .9).fillTriangle(x + 11, y, x + 5, y - 5, x + 5, y + 5);
  }

  private drawBird(): void {
    const rotation = Phaser.Math.Clamp(this.engine.velocityY / 900, -.35, .65);
    const cos = Math.cos(rotation); const sin = Math.sin(rotation);
    const point = (x: number, y: number): [number, number] => [CHIYO_BIRD_X + x * cos - y * sin, this.engine.birdY + x * sin + y * cos];
    const [bx, by] = point(0, 0);
    if (this.engine.invincible) {
      const pulse = 27 + Math.sin(this.time.now / 100) * 3;
      this.graphics.fillStyle(0x38bdf8, .18).fillCircle(bx, by, pulse);
      this.graphics.lineStyle(3, 0x7dd3fc, .9).strokeCircle(bx, by, pulse);
    }
    if (this.engine.speedBoosted) {
      const pulse = 31 + Math.sin(this.time.now / 75) * 3;
      this.graphics.fillStyle(0x000000, .22).fillCircle(bx, by, pulse);
      this.graphics.lineStyle(3, 0x94a3b8, .8).strokeCircle(bx, by, pulse);
    }
    if (this.engine.gliding) {
      const pulse = 35 + Math.sin(this.time.now / 110) * 2;
      this.graphics.lineStyle(3, 0x86efac, .85).strokeCircle(bx, by, pulse);
      this.graphics.lineStyle(2, 0x22c55e, .75).lineBetween(bx - pulse - 10, by, bx - pulse + 4, by);
    }
    this.graphics.fillStyle(0xfde047, 1).fillEllipse(bx, by, 42, 31);
    const [wx, wy] = point(-5, 7); this.graphics.fillStyle(0xf59e0b, 1).fillEllipse(wx, wy, 24, 13);
    const [ex, ey] = point(9, -6); this.graphics.fillStyle(0xffffff, 1).fillCircle(ex, ey, 5).fillStyle(0x111827, 1).fillCircle(ex + 1, ey, 2);
    const [beakX, beakY] = point(23, 0); this.graphics.fillStyle(0xfb923c, 1).fillTriangle(beakX, beakY - 4, beakX + 13, beakY, beakX, beakY + 4);
  }
}

@Component({ selector: 'app-chiyo-game', templateUrl: './chiyo-game.html', styleUrls: ['./chiyo-game.css', '../game-audio.css'], changeDetection: ChangeDetectionStrategy.OnPush })
export class ChiyoGame implements AfterViewInit, OnDestroy {
  readonly closed = output<void>(); readonly ready = output<void>();
  protected readonly paused = signal(false);
  protected readonly i18n = inject(I18nService);
  protected readonly audio = inject(GameAudioService);
  @ViewChild('gameHost', { static: true }) private gameHost!: ElementRef<HTMLDivElement>;
  private game?: Phaser.Game; private scene?: ChiyoScene;
  ngAfterViewInit(): void {
    this.audio.start('chiyo');
    this.scene = new ChiyoScene(key => this.i18n.t(key), paused => this.paused.set(paused), effect => this.audio.playEffect(effect));
    this.game = new Phaser.Game({ type: Phaser.AUTO, parent: this.gameHost.nativeElement, width: WIDTH, height: HEIGHT, backgroundColor: '#071b33', scene: this.scene, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH } });
    requestAnimationFrame(() => this.ready.emit());
  }
  flap(): void { this.scene?.flap(); }
  togglePause(): void { this.scene?.togglePause(); }
  restart(): void { this.scene?.restart(); }
  toggleAudio(): void { this.audio.toggle('chiyo'); }
  @HostListener('document:visibilitychange')
  protected pauseWhenHidden(): void { if (document.hidden) {this.scene?.pauseIfRunning();} }
  ngOnDestroy(): void { this.audio.stop(); this.game?.destroy(true); }
}
