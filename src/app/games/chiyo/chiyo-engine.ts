export interface ChiyoTerrainSlice { x: number; top: number; bottom: number; }
export interface ChiyoCollectible { x: number; y: number; collected: boolean; type?: 'seed' | 'shield' | 'speed' | 'glide'; }

export const CHIYO_WIDTH = 900;
export const CHIYO_HEIGHT = 500;
export const CHIYO_BIRD_X = 170;
export const CHIYO_SLICE_WIDTH = 45;
export const CHIYO_INVINCIBILITY_DURATION = 5;
export const CHIYO_SPEED_BOOST_DURATION = 5;
export const CHIYO_SPEED_BOOST_MULTIPLIER = 1.5;
export const CHIYO_GLIDE_DURATION = 3;

export class ChiyoEngine {
  terrain: ChiyoTerrainSlice[] = [];
  items: ChiyoCollectible[] = [];
  birdY = 250;
  velocityY = 0;
  distance = 0;
  flightTime = 0;
  itemScore = 0;
  speed = 190;
  ended = false;
  started = false;
  paused = false;
  invincibilityRemaining = 0;
  speedBoostRemaining = 0;
  glideRemaining = 0;
  private obstacleProfile: number[] = [];
  private obstacleFromTop = false;
  private obstacleHeight = 0;

  constructor(private readonly random: () => number = Math.random) { this.restart(); }

  get score(): number { return Math.floor(this.distance / 10) + this.itemScore; }
  get collectedItems(): number { return this.itemScore / 100; }
  get invincible(): boolean { return this.invincibilityRemaining > 0; }
  get speedBoosted(): boolean { return this.speedBoostRemaining > 0; }
  get gliding(): boolean { return this.glideRemaining > 0; }
  get level(): number { return Math.min(10, 1 + Math.floor(this.flightTime / 30)); }

  restart(): void {
    this.birdY = 250; this.velocityY = 0; this.distance = 0; this.flightTime = 0; this.itemScore = 0;
    this.speed = 190; this.ended = false; this.started = false; this.paused = false;
    this.invincibilityRemaining = 0;
    this.speedBoostRemaining = 0;
    this.glideRemaining = 0;
    this.obstacleProfile = []; this.obstacleFromTop = false; this.obstacleHeight = 0;
    this.terrain = [];
    for (let x = 0; x <= CHIYO_WIDTH + CHIYO_SLICE_WIDTH * 2; x += CHIYO_SLICE_WIDTH) {
      this.terrain.push(this.createSlice(x, this.terrain.length));
    }
    this.items = [];
  }

  flap(): void {
    if (this.paused) {return;}
    if (this.ended) { this.restart(); return; }
    this.started = true;
    this.velocityY = -360;
  }

  step(delta: number): void {
    if (!this.started || this.ended || this.paused || delta <= 0) {return;}
    const safeDelta = Math.min(delta, 0.035);
    this.flightTime += safeDelta;
    this.invincibilityRemaining = Math.max(0, this.invincibilityRemaining - safeDelta);
    this.speedBoostRemaining = Math.max(0, this.speedBoostRemaining - safeDelta);
    this.glideRemaining = Math.max(0, this.glideRemaining - safeDelta);
    if (this.gliding) {
      this.velocityY = 0;
    } else {
      this.velocityY += 980 * safeDelta;
      this.birdY += this.velocityY * safeDelta;
    }
    this.distance += this.speed * safeDelta;
    const baseSpeed = 190 + (this.level - 1) * 10;
    this.speed = baseSpeed * (this.speedBoosted ? CHIYO_SPEED_BOOST_MULTIPLIER : 1);
    this.moveWorld(this.speed * safeDelta);
    this.checkCollisions();
  }

  togglePause(): boolean {
    if (!this.started || this.ended) {return this.paused;}
    this.paused = !this.paused;
    return this.paused;
  }

  private moveWorld(amount: number): void {
    this.terrain.forEach(slice => slice.x -= amount);
    this.items.forEach(item => item.x -= amount);
    while (this.terrain[0].x < -CHIYO_SLICE_WIDTH) {
      this.terrain.shift();
      const last = this.terrain[this.terrain.length - 1];
      const next = this.createSlice(last.x + CHIYO_SLICE_WIDTH, Math.floor(this.distance / CHIYO_SLICE_WIDTH) + this.terrain.length);
      this.terrain.push(next);
      const itemRoll = this.random();
      if (itemRoll < 0.238) {
        const minY = next.top + 48;
        const maxY = CHIYO_HEIGHT - next.bottom - 48;
        if (maxY > minY) {
          this.items.push({
            x: next.x + CHIYO_SLICE_WIDTH / 2,
            y: minY + this.random() * (maxY - minY),
            collected: false,
            type: itemRoll < 0.006 ? 'shield' : itemRoll < 0.012 ? 'speed' : itemRoll < 0.018 ? 'glide' : 'seed',
          });
        }
      }
    }
    this.items = this.items.filter(item => item.x > -30 && !item.collected);
  }

  private createSlice(x: number, index: number): ChiyoTerrainSlice {
    if (this.distance === 0 && index < 11) {return { x, top: 55, bottom: 55 };}
    const wave = Math.sin(index * 0.42) * 55 + Math.sin(index * 0.13) * 30;
    const difficulty = Math.min(35, this.distance / 700);
    const gap = 280 - difficulty;
    const center = CHIYO_HEIGHT / 2 + wave;
    let top = Math.max(35, Math.min(205, center - gap / 2));
    let bottom = Math.max(35, Math.min(205, CHIYO_HEIGHT - (center + gap / 2)));

    // Occasionally grow a short, rounded terrain bump after the safe opening.
    // Three slices form a readable 55% → 100% → 55% obstacle profile.
    if (this.distance > 550 && this.obstacleProfile.length === 0 && this.random() < 0.045) {
      this.obstacleProfile = [0.55, 1, 0.55];
      this.obstacleFromTop = this.random() < 0.5;
      this.obstacleHeight = 20 + this.random() * 12;
    }
    const obstacleScale = this.obstacleProfile.shift();
    if (obstacleScale !== undefined) {
      const bump = this.obstacleHeight * obstacleScale;
      if (this.obstacleFromTop) {top = Math.min(225, top + bump);}
      else {bottom = Math.min(225, bottom + bump);}
    }

    return { x, top, bottom };
  }

  private checkCollisions(): void {
    for (const item of this.items) {
      const distance = Math.hypot(CHIYO_BIRD_X - item.x, this.birdY - item.y);
      if (!item.collected && distance < 27) {
        item.collected = true;
        if (item.type === 'shield') {
          this.invincibilityRemaining = CHIYO_INVINCIBILITY_DURATION;
        } else if (item.type === 'speed') {
          this.speedBoostRemaining = CHIYO_SPEED_BOOST_DURATION;
        } else if (item.type === 'glide') {
          this.glideRemaining = CHIYO_GLIDE_DURATION;
          this.velocityY = 0;
        } else {
          this.itemScore += 100;
        }
      }
    }

    if (this.invincible) {
      const safeBirdY = Math.max(15, Math.min(CHIYO_HEIGHT - 15, this.birdY));
      if (safeBirdY !== this.birdY) {
        this.birdY = safeBirdY;
        this.velocityY = 0;
      }
      return;
    }

    const slice = this.terrain.find(current => CHIYO_BIRD_X >= current.x && CHIYO_BIRD_X < current.x + CHIYO_SLICE_WIDTH);
    if (!slice || this.birdY - 15 <= slice.top || this.birdY + 15 >= CHIYO_HEIGHT - slice.bottom) { this.ended = true; }
  }
}
