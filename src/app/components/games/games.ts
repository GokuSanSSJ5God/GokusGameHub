import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { I18nService, TranslationKey } from '../../services/i18n.service';

interface Game {
  readonly id: string;
  readonly title: string;
  readonly category: TranslationKey;
  readonly icon: string;
  readonly color: string;
  readonly available: boolean;
}

@Component({ selector: 'app-games', templateUrl: './games.html', styleUrl: './games.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class Games {
  readonly gameSelected = output<string>();
  protected readonly i18n = inject(I18nService);
  protected readonly games: readonly Game[] = [
    { id: 'tetris', title: 'Neon Blocks', category: 'puzzle', icon: '▦', color: '#8b5cf6', available: true },
    { id: 'snake', title: 'Neon Snake', category: 'arcade', icon: '●', color: '#22c55e', available: true },
    { id: 'pixel-kingdom', title: 'Pixel Kingdom', category: 'strategy', icon: '♛', color: '#06b6d4', available: false },
    { id: 'night-rally', title: 'Night Rally', category: 'racing', icon: '◈', color: '#f97316', available: false }
  ];

  protected selectGame(game: Game): void {
    if (game.available) this.gameSelected.emit(game.id);
  }
}
