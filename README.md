# Just Bubbles 

A simple digital toy for popping soap bubbles.

No goals, high scores, timers, or levels.

**It's built to feel nostalgic and calming. A reminder that it's okay to enjoy something just because it's fun.**

---

## What this is

Just Bubbles recreates one of the simplest childhood pleasures: bubbles
drift gently across the screen, and you pop them. That's it. 

## Project goals

- Feel **nostalgic, relaxing, playful, satisfying, polished**.
- Zero objectives of any kind — nothing to win, lose, or track.
- Run instantly by opening `index.html`, no build step, no install.
- Stay small, modular and easy to read, so it's easy to customise or
  extend.

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


Enjoy the bubbles. 🫧
