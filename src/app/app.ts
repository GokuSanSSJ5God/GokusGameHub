import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Footer } from './components/footer/footer';
import { Games } from './components/games/games';
import { TitleHeader } from './components/title-header/title-header';
import { I18nService } from './services/i18n.service';

@Component({
  selector: 'app-root',
  imports: [TitleHeader, Games, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly i18n = inject(I18nService);
}
