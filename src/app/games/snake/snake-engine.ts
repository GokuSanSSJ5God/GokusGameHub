export interface SnakePoint { x: number; y: number; }
export type SnakeDirection = 'left' | 'right' | 'up' | 'down';

export class SnakeEngine {
  snake: SnakePoint[] = [];
  food: SnakePoint = { x: 0, y: 0 };
  score = 0;
  ended = false;
  private direction: SnakePoint = { x: 1, y: 0 };
  private queuedDirection: SnakePoint = { x: 1, y: 0 };

  constructor(readonly grid = 20, private readonly random: () => number = Math.random) { this.restart(); }

  restart(): void {
    const center = Math.floor(this.grid / 2);
    this.snake = [{ x: center, y: center }, { x: center - 1, y: center }, { x: center - 2, y: center }];
    this.direction = { x: 1, y: 0 }; this.queuedDirection = { x: 1, y: 0 };
    this.score = 0; this.ended = false; this.placeFood();
  }

  turn(target: SnakeDirection): boolean {
    if (this.ended) return false;
    const directions = { left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 } };
    const candidate = directions[target];
    if (candidate.x === -this.direction.x && candidate.y === -this.direction.y) return false;
    this.queuedDirection = candidate; return true;
  }

  step(): boolean {
    if (this.ended) return false;
    this.direction = this.queuedDirection;
    const head = this.snake[0];
    const next = { x: head.x + this.direction.x, y: head.y + this.direction.y };
    const eating = next.x === this.food.x && next.y === this.food.y;
    const bodyToCheck = eating ? this.snake : this.snake.slice(0, -1);
    const collision = next.x < 0 || next.x >= this.grid || next.y < 0 || next.y >= this.grid || bodyToCheck.some(segment => segment.x === next.x && segment.y === next.y);
    if (collision) { this.ended = true; return false; }
    this.snake.unshift(next);
    if (eating) { this.score += 10; this.placeFood(); } else this.snake.pop();
    return true;
  }

  setFood(point: SnakePoint): void { this.food = { ...point }; }

  private placeFood(): void {
    const free: SnakePoint[] = [];
    for (let y = 0; y < this.grid; y++) for (let x = 0; x < this.grid; x++) if (!this.snake.some(segment => segment.x === x && segment.y === y)) free.push({ x, y });
    this.food = free[Math.floor(this.random() * free.length)] ?? { x: 0, y: 0 };
  }
}
