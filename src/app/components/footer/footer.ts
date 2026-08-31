import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
@Component({ selector: 'app-footer', templateUrl: './footer.html', styleUrl: './footer.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class Footer { protected readonly i18n = inject(I18nService); }
