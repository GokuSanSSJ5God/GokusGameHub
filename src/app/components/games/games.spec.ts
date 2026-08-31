import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { Games } from './games';

describe('Games component', () => {
  it('emits tetris only after clicking its Play button', async () => {
    const fixture = TestBed.createComponent(Games);
    const selected = vi.fn();
    fixture.componentInstance.gameSelected.subscribe(selected);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    expect(selected).not.toHaveBeenCalled();
    buttons[0].click();
    expect(selected).toHaveBeenCalledWith('tetris');
  });

  it('disables games that are not available yet', () => {
    const fixture = TestBed.createComponent(Games);
    fixture.detectChanges();
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    expect(buttons.filter(button => button.disabled)).toHaveLength(2);
  });
});
