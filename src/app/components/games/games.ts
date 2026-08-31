import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService, TranslationKey } from '../../services/i18n.service';
interface Game { readonly title: string; readonly category: TranslationKey; readonly icon: string; readonly color: string; }
@Component({ selector: 'app-games', templateUrl: './games.html', styleUrl: './games.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class Games {
  protected readonly i18n = inject(I18nService);
  protected readonly games: readonly Game[] = [
    { title: 'Cyber Runner', category: 'action', icon: '⚡', color: '#8b5cf6' }, { title: 'Pixel Kingdom', category: 'strategy', icon: '♛', color: '#06b6d4' }, { title: 'Night Rally', category: 'racing', icon: '◈', color: '#f97316' }
  ];
}
