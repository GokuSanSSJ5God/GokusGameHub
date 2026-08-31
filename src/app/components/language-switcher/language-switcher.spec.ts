import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { I18nService } from '../../services/i18n.service';
import { LanguageSwitcher } from './language-switcher';

describe('LanguageSwitcher component', () => {
  it('changes the shared application language after a flag click', () => {
    const fixture = TestBed.createComponent(LanguageSwitcher);
    const i18n = TestBed.inject(I18nService);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    buttons[1].click();
    expect(i18n.language()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('marks the selected language as active', () => {
    const fixture = TestBed.createComponent(LanguageSwitcher);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    buttons[2].click();
    fixture.detectChanges();
    expect(buttons[2].classList.contains('active')).toBe(true);
  });
});
