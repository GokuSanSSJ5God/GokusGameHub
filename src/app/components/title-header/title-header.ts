import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
@Component({ selector: 'app-title-header', imports: [LanguageSwitcher], templateUrl: './title-header.html', styleUrl: './title-header.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class TitleHeader { protected readonly i18n = inject(I18nService); }
