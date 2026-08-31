# Goku's GameHub

Goku's GameHub is a responsive browser-based arcade built with Angular and Phaser. It provides a lightweight game catalog where every game is loaded only after the player selects it, keeping the initial page fast.

## Games

- **Neon Blocks** — a falling-block puzzle game with line clearing, scoring, keyboard controls, and touch controls.
- **Neon Snake** — a classic snake game with increasing speed, food collection, keyboard controls, and touch controls.
- **Chiyo's Flight** — help Chiyo fly through procedural terrain, collect golden seeds, and earn points for distance travelled.

## Features

- Responsive desktop and mobile layout
- Phaser games embedded in standalone Angular components
- Lazy-loaded Phaser and game code
- Polish, English, and Japanese interface translations
- Keyboard and touch controls
- Game logic separated into testable TypeScript engines
- Unit and Angular component tests powered by Vitest

## Requirements

- [Node.js](https://nodejs.org/) 22.22.3 or newer
- npm, included with Node.js

## Running locally

Clone the repository and enter its directory:

```bash
git clone https://github.com/GokuSanSSJ5God/GokusGameHub.git
cd GokusGameHub
```

Install the dependencies:

```bash
npm install
```

Start the Angular development server:

```bash
npm start
```

Open [http://localhost:4200](http://localhost:4200) in your browser. The development server automatically reloads the page after source-file changes.

## Tests

Run the complete test suite once:

```bash
npm test
```

The tests cover core game rules such as movement, collisions, scoring, completed lines, collectibles, safe starting conditions, and pause behaviour. Angular component tests cover game selection and language switching.

## Production build

Create an optimized production build:

```bash
npm run build
```

The generated static site is written to:

```text
dist/gokus-game-hub/browser
```

## Main project structure

```text
src/app/
├── components/       # Angular UI and Phaser game components
├── games/            # Testable game engines and unit tests
├── services/         # Shared translation service
├── app.ts            # Root application component
└── app.html          # Main page composition

public/assets/
├── flags/            # Language selector flags
└── games/            # Game catalog cover images
```

## Controls

### Neon Blocks

- Arrow keys or `WASD` — move and rotate
- `Space` — hard drop
- `R` — restart

### Neon Snake

- Arrow keys or `WASD` — change direction
- `R` — restart

### Chiyo's Flight

- Click, tap, `Space`, or `Arrow Up` — flap
- `P` or `Esc` — pause or resume
- `R` — restart

Mobile-friendly controls are displayed below each game when needed.
