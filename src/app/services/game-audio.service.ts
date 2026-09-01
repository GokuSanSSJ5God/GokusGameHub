import { Injectable, signal } from '@angular/core';

export type GameAudioTheme = 'tetris' | 'snake' | 'chiyo';
export type GameSoundEffect = 'turn' | 'drop' | 'score' | 'flap' | 'gameOver';

const THEME_NOTES: Record<GameAudioTheme, readonly number[][]> = {
  tetris: [[220, 277.18, 329.63], [196, 246.94, 293.66], [174.61, 220, 261.63], [196, 246.94, 329.63]],
  snake: [[146.83, 174.61, 220], [130.81, 164.81, 196], [146.83, 185, 220], [123.47, 164.81, 196]],
  chiyo: [[261.63, 329.63, 392], [293.66, 369.99, 440], [246.94, 329.63, 392], [220, 293.66, 369.99]],
};

@Injectable({ providedIn: 'root' })
export class GameAudioService {
  readonly enabled = signal(this.readPreference());
  private context?: AudioContext;
  private musicGain?: GainNode;
  private timer?: ReturnType<typeof setInterval>;
  private theme?: GameAudioTheme;
  private chordIndex = 0;

  start(theme: GameAudioTheme): void {
    this.theme = theme;
    if (this.enabled()) this.startMusic();
  }

  toggle(theme: GameAudioTheme): void {
    this.theme = theme;
    this.enabled.update(enabled => !enabled);
    try { localStorage.setItem('game-audio-enabled', String(this.enabled())); } catch { /* Storage may be unavailable. */ }
    if (this.enabled()) this.startMusic(); else this.stopMusic();
  }

  playEffect(effect: GameSoundEffect): void {
    if (!this.enabled()) return;
    const context = this.ensureContext();
    const presets: Record<GameSoundEffect, [number, number, number, OscillatorType]> = {
      turn: [330, 440, .07, 'sine'],
      drop: [180, 90, .14, 'triangle'],
      score: [523.25, 783.99, .22, 'sine'],
      flap: [392, 587.33, .11, 'triangle'],
      gameOver: [220, 82.41, .55, 'sawtooth'],
    };
    const [from, to, duration, type] = presets[effect];
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(to, context.currentTime + duration);
    gain.gain.setValueAtTime(.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(effect === 'gameOver' ? .055 : .035, context.currentTime + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + .02);
  }

  stop(): void {
    this.theme = undefined;
    this.stopMusic();
  }

  private startMusic(): void {
    if (!this.theme) return;
    const context = this.ensureContext();
    void context.resume();
    this.stopMusic();
    this.musicGain = context.createGain();
    this.musicGain.gain.setValueAtTime(.045, context.currentTime);
    this.musicGain.connect(context.destination);
    this.chordIndex = 0;
    this.scheduleChord();
    this.timer = setInterval(() => this.scheduleChord(), 2400);
  }

  private scheduleChord(): void {
    if (!this.context || !this.musicGain || !this.theme) return;
    const notes = THEME_NOTES[this.theme][this.chordIndex++ % THEME_NOTES[this.theme].length];
    const now = this.context.currentTime;
    notes.forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      oscillator.type = this.theme === 'snake' ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, now + index * .16);
      gain.gain.exponentialRampToValueAtTime(.16, now + .18 + index * .16);
      gain.gain.exponentialRampToValueAtTime(.0001, now + 2.25);
      oscillator.connect(gain).connect(this.musicGain!);
      oscillator.start(now + index * .16);
      oscillator.stop(now + 2.3);
    });
  }

  private stopMusic(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.musicGain?.gain.setTargetAtTime(.0001, this.context?.currentTime ?? 0, .04);
    this.musicGain = undefined;
  }

  private ensureContext(): AudioContext {
    this.context ??= new AudioContext();
    return this.context;
  }

  private readPreference(): boolean {
    try { return localStorage.getItem('game-audio-enabled') === 'true'; } catch { return false; }
  }
}
