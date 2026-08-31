export interface ChiyoTerrainSlice { x: number; top: number; bottom: number; }
export interface ChiyoCollectible { x: number; y: number; collected: boolean; }

export const CHIYO_WIDTH = 900;
export const CHIYO_HEIGHT = 500;
export const CHIYO_BIRD_X = 170;
export const CHIYO_SLICE_WIDTH = 45;

export class ChiyoEngine {
  terrain: ChiyoTerrainSlice[] = [];
  items: ChiyoCollectible[] = [];
  birdY = 250;
  velocityY = 0;
  distance = 0;
  itemScore = 0;
  speed = 190;
  ended = false;
  started = false;

  constructor(private readonly random: () => number = Math.random) { this.restart(); }

  get score(): number { return Math.floor(this.distance / 10) + this.itemScore; }
  get collectedItems(): number { return this.itemScore / 100; }

  restart(): void {
    this.birdY = 250; this.velocityY = 0; this.distance = 0; this.itemScore = 0;
    this.speed = 190; this.ended = false; this.started = false;
    this.terrain = [];
    for (let x = 0; x <= CHIYO_WIDTH + CHIYO_SLICE_WIDTH * 2; x += CHIYO_SLICE_WIDTH) {
      this.terrain.push(this.createSlice(x, this.terrain.length));
    }
    this.items = [];
  }

  flap(): void {
    if (this.ended) { this.restart(); return; }
    this.started = true;
    this.velocityY = -360;
  }

  step(delta: number): void {
    if (!this.started || this.ended || delta <= 0) return;
    const safeDelta = Math.min(delta, 0.035);
    this.velocityY += 980 * safeDelta;
    this.birdY += this.velocityY * safeDelta;
    this.distance += this.speed * safeDelta;
    this.speed = Math.min(280, 190 + this.distance / 90);
    this.moveWorld(this.speed * safeDelta);
    this.checkCollisions();
  }

  private moveWorld(amount: number): void {
    this.terrain.forEach(slice => slice.x -= amount);
    this.items.forEach(item => item.x -= amount);
    while (this.terrain[0].x < -CHIYO_SLICE_WIDTH) {
      this.terrain.shift();
      const last = this.terrain[this.terrain.length - 1];
      const next = this.createSlice(last.x + CHIYO_SLICE_WIDTH, Math.floor(this.distance / CHIYO_SLICE_WIDTH) + this.terrain.length);
      this.terrain.push(next);
      if (this.random() < 0.22) {
        const minY = next.top + 48;
        const maxY = CHIYO_HEIGHT - next.bottom - 48;
        if (maxY > minY) this.items.push({ x: next.x + CHIYO_SLICE_WIDTH / 2, y: minY + this.random() * (maxY - minY), collected: false });
      }
    }
    this.items = this.items.filter(item => item.x > -30 && !item.collected);
  }

  private createSlice(x: number, index: number): ChiyoTerrainSlice {
    if (this.distance === 0 && index < 11) return { x, top: 55, bottom: 55 };
    const wave = Math.sin(index * 0.42) * 55 + Math.sin(index * 0.13) * 30;
    const difficulty = Math.min(45, this.distance / 500);
    const gap = 245 - difficulty;
    const center = CHIYO_HEIGHT / 2 + wave;
    return { x, top: Math.max(35, Math.min(205, center - gap / 2)), bottom: Math.max(35, Math.min(205, CHIYO_HEIGHT - (center + gap / 2))) };
  }

  private checkCollisions(): void {
    const slice = this.terrain.find(current => CHIYO_BIRD_X >= current.x && CHIYO_BIRD_X < current.x + CHIYO_SLICE_WIDTH);
    if (!slice || this.birdY - 15 <= slice.top || this.birdY + 15 >= CHIYO_HEIGHT - slice.bottom) { this.ended = true; return; }
    for (const item of this.items) {
      const distance = Math.hypot(CHIYO_BIRD_X - item.x, this.birdY - item.y);
      if (!item.collected && distance < 27) { item.collected = true; this.itemScore += 100; }
    }
  }
}
