# Just Bubbles 🫧

A tiny digital toy for popping soap bubbles.

No goals. No scores. No timers. No levels.

**No pressure. No productivity. Just bubbles.**

---

## What this is

Just Bubbles recreates one of the simplest childhood pleasures: bubbles
drift gently across the screen, and you pop them. That's it. It's built
to feel nostalgic, calming and a little whimsical — a reminder that it's
okay to enjoy something purely because it's fun.

## Project goals

- Feel **nostalgic, relaxing, playful, satisfying, polished**.
- Zero objectives of any kind — nothing to win, lose, or track.
- Run instantly by opening `index.html`, no build step, no install.
- Stay small, modular and easy to read, so it's easy to customise or
  extend.

---

## Folder structure

```
just-bubbles/
├── index.html            The single HTML page — open this to run the app
├── css/
│   ├── styles.css        Background, bubbles, pop animation, intro message
│   └── controls.css      The expandable controls panel
├── js/
│   ├── config.js         Every tunable value lives here — start here first
│   ├── utils.js          Small shared helper functions (random numbers, etc.)
│   ├── audio.js          Synthesised pop sounds (Web Audio API)
│   ├── bubbles.js        Creating, popping and managing bubble DOM elements
│   ├── animation.js       The per-frame movement loop (rAF)
│   ├── controls.js       Builds and wires up the controls panel
│   └── app.js            Wires every module together (the entry point)
├── assets/
│   ├── audio/            Empty by default — see "How to replace sound effects"
│   ├── icons/            Empty — reserved for future UI icons
│   └── images/           Empty — reserved for future visual assets
└── README.md             You are here
```

Each JS file is heavily commented with a "what it does / why it exists /
how it works / what you can customise" header, so if you're new to the
code, start by reading those comment blocks top to bottom.

---

## How to run locally

There's no build step and no dependencies to install. Just open the file:

1. Download or clone this folder.
2. Double-click `index.html` (or right-click → Open With → your browser).

That's it — the app runs entirely client-side.

If your browser blocks local file access to fonts/scripts (some do, for
security reasons), serve the folder with any simple static server
instead, for example:

```bash
# From inside the just-bubbles folder:
python3 -m http.server 8080
# then open http://localhost:8080 in your browser
```

---

## How to customise bubble behaviour

Almost everything is controlled from **`js/config.js`** — open it and
look for the section you want to change:

| I want to...                                   | Edit this in `config.js`                     |
|-------------------------------------------------|-----------------------------------------------|
| Change how often bubbles spawn                   | `spawnPresets` (gentle / playful / busy)      |
| Change bubble movement speed                     | `speedPresets` (dreamy / breezy / quick)      |
| Change bubble sizes                              | `sizePresets` (tiny / mixed / big)            |
| Make bubbles wobble more or less                 | `wobble.amplitudeMin/Max`, `frequencyMin/Max` |
| Make bubbles drift diagonally more/less often     | `diagonalDriftChance`, `maxDiagonalDrift`    |
| Change how long the pop animation takes           | `popAnimationDurationMs` (keep in sync with the CSS animation duration in `styles.css`) |

Every value has a comment above it explaining what it does and roughly
what a sensible range is.

---

## How to replace sound effects

Just Bubbles **synthesises** its pop sounds on the fly using the Web
Audio API (see `js/audio.js`) — there are no audio files to manage, and
every pop can have subtle natural variation for free.

If you'd rather use your own recorded sounds:

1. Drop your audio files into `assets/audio/`, e.g.:
   - `pop-classic.mp3`
   - `pop-soft.mp3`
   - `pop-playful.mp3`
2. In `js/audio.js`, find the `playPop()` function and replace its body
   with something like:
   ```js
   const audio = new Audio(`assets/audio/pop-${settings.style}.mp3`);
   audio.volume = settings.volume;
   if (settings.pitchVariationEnabled) {
     audio.playbackRate = getPitchMultiplier(bubbleDiameter);
   }
   audio.play();
   ```
3. Everything else — the controls panel, volume, mute, pitch variation —
   keeps working exactly the same, since only `playPop()` needed to change.

To add a brand new *style* (beyond Classic / Soft / Playful) to the
synthesised system instead, add a new function to the `popRecipes`
object in `js/audio.js` and list its name in `AudioSystem.availableStyles`.

---

## How to customise colours

The background palette lives in `js/config.js` under
`backgroundGradientColors` — it's a simple array of hex colours:

```js
backgroundGradientColors: [
  '#fbe0dd', // blush pink
  '#fde3cf', // peach
  '#f8c3b0', // pale coral
  '#fbead9', // apricot-cream
  '#fff8ef', // warm cream
],
```

Add, remove or swap any of these hex values for your own palette — the
animation automatically works with however many colours you provide.
`backgroundAnimationDurationSec` controls how slowly the gradient drifts
(bigger number = slower, calmer).

Bubble colouring (the rainbow sheen) is procedural rather than a fixed
palette — see the `--bubble-hue` custom property in `css/styles.css`
if you want to restrict or shift the rainbow's hue range.

---

## How to adjust animation settings

- **Movement math** (wobble, drift, rising speed) lives in
  `js/animation.js` inside `updateBubble()`. The *ranges* it pulls from
  are in `config.js` (see the table above) — prefer tuning those first.
- **Pop/burst animation** timing and easing live in `css/styles.css`
  under the `bubble-compress-fade` and `shimmer-burst` `@keyframes`
  blocks.
- **Background drift** timing/easing lives in `css/styles.css` under the
  `drift-background` `@keyframes` block; its duration is driven by
  `backgroundAnimationDurationSec` in `config.js`.

---

## How to configure the control panel

The panel's *options* (Gentle/Playful/Busy, Dreamy/Breezy/Quick, etc.)
are built in `js/controls.js` inside `buildPanelMarkup()`. If you add a
new preset to `config.js` (say, a fourth speed option), add a matching
button in that function so it appears in the UI — presets in config.js
are intentionally not auto-generated into buttons, so labels stay
human-friendly and deliberate.

The panel's visual style (colours, spacing, the collapsed "pill" vs.
expanded panel look) lives entirely in `css/controls.css`.

---

## How to embed Just Bubbles into another website

Just Bubbles is built to *not* assume it owns the whole browser viewport,
so embedding it is straightforward:

**As an iframe:**
```html
<iframe
  src="path/to/just-bubbles/index.html"
  style="width: 800px; height: 600px; border: none; border-radius: 16px;"
  title="Just Bubbles">
</iframe>
```

**Inside an existing page**, give the container a sized wrapper — the
`.bubble-container` element fills 100% of its parent's width/height, so
just make sure whatever wraps it has an explicit size:
```html
<div style="width: 100%; height: 500px;">
  <!-- paste the contents of <body> here, or load via iframe -->
</div>
```

**Inside a draggable/resizable window** (e.g. a portfolio site widget):
since the app only ever reads its container's *current* size each frame
(via `getBoundingClientRect()`), resizing the container on the fly works
with no extra code — bubbles will simply start respecting the new
dimensions for their next movement update.

---

## How to prepare the project for GitHub

The project is already GitHub-safe: relative paths throughout, no
build step, no environment variables, no server required.

1. Initialise a repo in this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Just Bubbles"
   ```
2. (Optional) Enable GitHub Pages on the repo, pointing at the root of
   the `main` branch — since `index.html` sits at the project root,
   it'll be served automatically at `https://<username>.github.io/<repo>/`.
3. `assets/icons/` and `assets/images/` include `.gitkeep` placeholder
   files so the empty folders are preserved in git (git doesn't track
   empty directories by default) — delete those once you add real files.

---

## Browser support

Tested against evergreen desktop browsers: Chrome, Edge, Firefox, and
Safari. This is a desktop-first experience; mobile layout optimisation
isn't a design goal, though touch/tap/drag interactions do work via
Pointer Events.

## Accessibility

- The controls panel toggle and buttons are all real `<button>` elements,
  reachable and operable via keyboard.
- Visible focus outlines are provided for the panel's toggle, buttons
  and inputs (`:focus-visible` in `controls.css`).
- ARIA labels/roles are used on the button groups, the bubble area, and
  the pause button's pressed state.
- `prefers-reduced-motion` is respected for the large decorative
  background animation.

## Future features (not yet implemented)

The codebase is structured so these can be added without a rewrite —
see the "FUTURE FEATURES HOOK" comment near the bottom of `js/bubbles.js`
for the intended extension point:

- Golden bubbles / rainbow bubbles
- Bubble clusters
- Giant bubbles
- Bubbles that split into smaller bubbles when popped
- Rainbow trails
- Sparkle effects
- Seasonal themes

---

Enjoy the bubbles. 🫧
