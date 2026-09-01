import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, afterNextRender, inject, signal } from '@angular/core';
import { Footer } from './components/footer/footer';
import { Games } from './components/games/games';
import { TitleHeader } from './components/title-header/title-header';
import { TetrisGame } from './components/tetris-game/tetris-game';
import { SnakeGame } from './components/snake-game/snake-game';
import { ChiyoGame } from './components/chiyo-game/chiyo-game';
import { I18nService } from './services/i18n.service';

@Component({
  selector: 'app-root',
  imports: [TitleHeader, TetrisGame, SnakeGame, ChiyoGame, Games, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly i18n = inject(I18nService);
  protected readonly selectedGame = signal<string | null>(null);
  private readonly changeDetector = inject(ChangeDetectorRef);

  constructor() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    afterNextRender(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  }

  protected openGame(gameId: string): void {
    if (this.selectedGame() === gameId) {
      this.selectedGame.set(null);
      this.changeDetector.detectChanges();
      this.selectedGame.set(gameId);
      return;
    }
    this.selectedGame.set(gameId);
  }

  @HostListener('window:pageshow', ['$event'])
  protected resetRestoredGame(event: PageTransitionEvent): void {
    if (event.persisted) {
      this.selectedGame.set(null);
      this.changeDetector.detectChanges();
    }
  }

  protected scrollToGame(): void {
    document.querySelector('#active-game')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected scrollToSnake(): void {
    document.querySelector('#active-snake')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected scrollToChiyo(): void {
    document.querySelector('#active-chiyo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
