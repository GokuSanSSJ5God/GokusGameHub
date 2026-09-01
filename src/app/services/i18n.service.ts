import { Injectable, signal } from '@angular/core';
export type Language = 'pl' | 'en' | 'ja';

const translations = {
  pl: {
    games: 'Gry', about: 'O nas', heroEyebrow: 'GRY W JEDNYM MIEJSCU', heroTitle: 'Twój następny świat', heroAccent: 'zaczyna się tutaj.',
    heroText: 'Odkrywaj nowe gry, wracaj do ulubionych tytułów i graj po swojemu.', browse: 'Przeglądaj gry', trending: 'NA TOPIE', popular: 'Popularne teraz',
    seeAll: 'Zobacz wszystkie', play: 'Graj', soon: 'Wkrótce', place: 'Miejsce stworzone dla graczy.', aboutText: 'To dopiero początek. Wkrótce pojawią się tu profile, biblioteka gier i rankingi społeczności.',
    madeFor: 'Stworzone dla graczy.', puzzle: 'Logiczna', arcade: 'Zręcznościowa', action: 'Akcja', strategy: 'Strategia', racing: 'Wyścigi',
    playNow: 'ZAGRAJ TERAZ', tetrisDesc: 'Klasyczny Tetris zbudowany w Phaser. Użyj strzałek, spacji albo przycisków dotykowych.', snakeDesc: 'Zbieraj jedzenie, rośnij i nie uderz w ścianę ani we własny ogon.',
    movement: 'ruch', rotation: 'obrót', moveDown: 'w dół', drop: 'upuść', restart: 'restart', newGame: 'Nowa gra', backToGames: 'Wróć do gier', score: 'PUNKTY', lines: 'LINIE', length: 'DŁUGOŚĆ', gameOver: 'KONIEC GRY', chiyoDesc: 'Klikaj, aby Chiyo wzbił się wyżej. Omijaj teren, zbieraj złote nasiona i leć jak najdalej.', distance: 'DYSTANS', level: 'POZIOM', items: 'PRZEDMIOTY', shield: 'OSŁONA', speedUp: 'PRZYSPIESZENIE', glide: 'STABILNY LOT', pause: 'Pauza', resume: 'Wznów', paused: 'PAUZA', speed: 'Prędkość gry', musicOn: 'Włącz muzykę i dźwięki', musicOff: 'Wyłącz muzykę i dźwięki', gridOn: 'Włącz siatkę', gridOff: 'Wyłącz siatkę', flyChiyo: 'Leć, Chiyo!', flap: 'Wzleć'
  },
  en: {
    games: 'Games', about: 'About', heroEyebrow: 'ALL YOUR GAMES IN ONE PLACE', heroTitle: 'Your next world', heroAccent: 'starts right here.',
    heroText: 'Discover new games, return to your favorites and play your way.', browse: 'Browse games', trending: 'TRENDING', popular: 'Popular now',
    seeAll: 'See all', play: 'Play', soon: 'Soon', place: 'A place made for gamers.', aboutText: 'This is just the beginning. Profiles, game libraries and community rankings are coming soon.',
    madeFor: 'Made for players.', puzzle: 'Puzzle', arcade: 'Arcade', action: 'Action', strategy: 'Strategy', racing: 'Racing',
    playNow: 'PLAY NOW', tetrisDesc: 'Classic Tetris built with Phaser. Use the arrow keys, spacebar or touch controls.', snakeDesc: 'Collect food, grow and avoid hitting the walls or your own tail.',
    movement: 'move', rotation: 'rotate', moveDown: 'down', drop: 'drop', restart: 'restart', newGame: 'New game', backToGames: 'Back to games', score: 'SCORE', lines: 'LINES', length: 'LENGTH', gameOver: 'GAME OVER', chiyoDesc: 'Click to help Chiyo fly higher. Avoid the terrain, collect golden seeds and travel as far as possible.', distance: 'DISTANCE', level: 'LEVEL', items: 'ITEMS', shield: 'SHIELD', speedUp: 'SPEED UP', glide: 'STEADY FLIGHT', pause: 'Pause', resume: 'Resume', paused: 'PAUSED', speed: 'Game speed', musicOn: 'Turn music and sounds on', musicOff: 'Turn music and sounds off', gridOn: 'Turn grid on', gridOff: 'Turn grid off', flyChiyo: 'Fly, Chiyo!', flap: 'Flap'
  },
  ja: {
    games: 'ゲーム', about: '私たちについて', heroEyebrow: 'すべてのゲームをひとつの場所に', heroTitle: '次の世界は', heroAccent: 'ここから始まる。',
    heroText: '新しいゲームを見つけ、お気に入りに戻り、自分らしくプレイしよう。', browse: 'ゲームを見る', trending: 'トレンド', popular: '今人気のゲーム',
    seeAll: 'すべて見る', play: 'プレイ', soon: '近日公開', place: 'ゲーマーのための場所。', aboutText: 'これは始まりにすぎません。プロフィール、ゲームライブラリ、コミュニティランキングを近日公開します。',
    madeFor: 'プレイヤーのために。', puzzle: 'パズル', arcade: 'アーケード', action: 'アクション', strategy: 'ストラテジー', racing: 'レース',
    playNow: '今すぐプレイ', tetrisDesc: 'Phaserで作られたクラシックテトリス。矢印キー、スペースキー、またはタッチ操作で遊べます。', snakeDesc: 'エサを集めて成長し、壁や自分のしっぽにぶつからないようにしよう。',
    movement: '移動', rotation: '回転', moveDown: '下へ', drop: '落下', restart: 'リスタート', newGame: '新しいゲーム', backToGames: 'ゲーム一覧へ', score: 'スコア', lines: 'ライン', length: '長さ', gameOver: 'ゲームオーバー', chiyoDesc: 'クリックしてチヨを高く飛ばそう。地形を避け、金色の種を集めて、できるだけ遠くまで飛ぼう。', distance: '距離', level: 'レベル', items: 'アイテム', shield: 'シールド', speedUp: 'スピードアップ', glide: '安定飛行', pause: '一時停止', resume: '再開', paused: '一時停止中', speed: 'ゲーム速度', musicOn: '音楽と効果音をオン', musicOff: '音楽と効果音をオフ', gridOn: 'グリッドをオン', gridOff: 'グリッドをオフ', flyChiyo: '飛べ、チヨ！', flap: '羽ばたく'
  }
} as const;

export type TranslationKey = keyof typeof translations.pl;

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly language = signal<Language>('pl');
  setLanguage(language: Language): void { this.language.set(language); document.documentElement.lang = language; }
  t(key: TranslationKey): string { return translations[this.language()][key]; }
}
