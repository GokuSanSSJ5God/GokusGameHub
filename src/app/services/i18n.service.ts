import { Injectable, signal } from '@angular/core';
export type Language = 'pl' | 'en' | 'ja';
const translations = {
  pl: { games: 'Gry', about: 'O nas', heroEyebrow: 'GRY W JEDNYM MIEJSCU', heroTitle: 'Twój następny świat', heroAccent: 'zaczyna się tutaj.', heroText: 'Odkrywaj nowe gry, wracaj do ulubionych tytułów i graj po swojemu.', browse: 'Przeglądaj gry', trending: 'NA TOPIE', popular: 'Popularne teraz', seeAll: 'Zobacz wszystkie', play: 'Graj', place: 'Miejsce stworzone dla graczy.', aboutText: 'To dopiero początek. Wkrótce pojawią się tu profile, biblioteka gier i rankingi społeczności.', madeFor: 'Stworzone dla graczy.', action: 'Akcja', strategy: 'Strategia', racing: 'Wyścigi' },
  en: { games: 'Games', about: 'About', heroEyebrow: 'ALL YOUR GAMES IN ONE PLACE', heroTitle: 'Your next world', heroAccent: 'starts right here.', heroText: 'Discover new games, return to your favorites and play your way.', browse: 'Browse games', trending: 'TRENDING', popular: 'Popular now', seeAll: 'See all', play: 'Play', place: 'A place made for gamers.', aboutText: 'This is just the beginning. Profiles, game libraries and community rankings are coming soon.', madeFor: 'Made for players.', action: 'Action', strategy: 'Strategy', racing: 'Racing' },
  ja: { games: 'ゲーム', about: '私たちについて', heroEyebrow: 'すべてのゲームをひとつの場所に', heroTitle: '次の世界は', heroAccent: 'ここから始まる。', heroText: '新しいゲームを見つけ、お気に入りに戻り、自分らしくプレイしよう。', browse: 'ゲームを見る', trending: 'トレンド', popular: '今人気のゲーム', seeAll: 'すべて見る', play: 'プレイ', place: 'ゲーマーのための場所。', aboutText: 'これは始まりにすぎません。プロフィール、ゲームライブラリ、コミュニティランキングを近日公開します。', madeFor: 'プレイヤーのために。', action: 'アクション', strategy: 'ストラテジー', racing: 'レース' }
} as const;
export type TranslationKey = keyof typeof translations.pl;
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly language = signal<Language>('pl');
  setLanguage(language: Language): void { this.language.set(language); document.documentElement.lang = language; }
  t(key: TranslationKey): string { return translations[this.language()][key]; }
}
