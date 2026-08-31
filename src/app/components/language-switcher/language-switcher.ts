import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService, Language } from '../../services/i18n.service';
@Component({ selector: 'app-language-switcher', templateUrl: './language-switcher.html', styleUrl: './language-switcher.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class LanguageSwitcher {
  protected readonly i18n = inject(I18nService);
  protected setLanguage(language: Language): void { this.i18n.setLanguage(language); }
}
