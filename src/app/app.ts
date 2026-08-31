import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Footer } from './components/footer/footer';
import { Games } from './components/games/games';
import { TitleHeader } from './components/title-header/title-header';
import { TetrisGame } from './components/tetris-game/tetris-game';
import { I18nService } from './services/i18n.service';

@Component({
  selector: 'app-root',
  imports: [TitleHeader, TetrisGame, Games, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly i18n = inject(I18nService);
  protected readonly selectedGame = signal<string | null>(null);

  protected openGame(gameId: string): void {
    this.selectedGame.set(gameId);
  }

  protected scrollToGame(): void {
    document.querySelector('#active-game')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
