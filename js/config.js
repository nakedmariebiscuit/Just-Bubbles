/**
 * ============================================================================
 * CONFIG.JS
 * ============================================================================
 * WHAT THIS FILE DOES:
 * This is the single source of truth for every tunable number, colour and
 * label used across Just Bubbles. If you want to change how the app looks,
 * feels or behaves, start here before touching any other file.
 *
 * WHY IT EXISTS:
 * Keeping all "magic numbers" in one place means the rest of the codebase
 * never hard-codes values. Other modules read from `CONFIG` instead of
 * inventing their own numbers, so a single edit here ripples everywhere
 * consistently.
 *
 * HOW IT WORKS:
 * `CONFIG` is a plain JavaScript object attached to the global `window`
 * (no build tools / bundler are used in this project, so plain script tags
 * + shared globals are how the modules talk to each other). Every other
 * file in /js loads after this one (see index.html) and can safely read
 * `CONFIG.something`.
 *
 * WHAT YOU CAN SAFELY CUSTOMISE:
 * Everything in here is designed to be beginner-friendly to tweak. Read the
 * comment above each group before changing it.
 * ============================================================================
 */

const CONFIG = {

  // --------------------------------------------------------------------
  // BUBBLE POPULATION
  // --------------------------------------------------------------------
  // There is deliberately no automatic bubble limit or clean-up here.
  // An earlier version of this app auto-popped the oldest bubbles once
  // a maximum was reached, but that housekeeping was visible and
  // audible in a way that felt distracting rather than "in the
  // background" -- it drew attention to itself instead of staying
  // invisible. If the screen gets too full, the "Clear" control in the
  // panel gives users an instant, obvious way to reset it themselves,
  // which reads as an intentional action rather than a mysterious glitch.

  // --------------------------------------------------------------------
  // SPAWNING
  // --------------------------------------------------------------------
  // Each "frequency" preset controls how often new bubbles appear and
  // how many spawn in a single burst. Times are in milliseconds.
  spawnPresets: {
    gentle:  { intervalMs: 900, bubblesPerSpawn: 1 },
    playful: { intervalMs: 550, bubblesPerSpawn: 1 },
    busy:    { intervalMs: 260, bubblesPerSpawn: 2 },
  },

  // Which frequency preset is active when the app first loads.
  defaultSpawnPreset: 'playful',

  // --------------------------------------------------------------------
  // MOVEMENT SPEED
  // --------------------------------------------------------------------
  // Speed is expressed as a range of pixels-per-second travelled upward.
  // Movement speed and spawn speed are intentionally kept as separate
  // values (as requested in the brief) so they can evolve independently
  // in the future -- e.g. a "busy + dreamy" combination is totally valid.
  speedPresets: {
    dreamy: { minSpeed: 18, maxSpeed: 34 },
    breezy: { minSpeed: 34, maxSpeed: 58 },
    quick:  { minSpeed: 58, maxSpeed: 92 },
  },

  defaultSpeedPreset: 'breezy',

  // --------------------------------------------------------------------
  // BUBBLE SIZE
  // --------------------------------------------------------------------
  // Sizes are diameters in pixels. Every preset still rolls a random
  // value inside its own range, so bubbles never feel identical even
  // within the same preset.
  sizePresets: {
    tiny:  { min: 14, max: 34 },
    mixed: { min: 18, max: 74 },
    big:   { min: 55, max: 110 },
  },

  defaultSizePreset: 'mixed',

  // --------------------------------------------------------------------
  // WOBBLE & DRIFT (movement "organic-ness")
  // --------------------------------------------------------------------
  // These values are what stop bubbles from travelling in perfectly
  // straight, mechanical lines. See animation.js for how they're used.
  wobble: {
    // How wide the side-to-side sway can be, in pixels.
    amplitudeMin: 8,
    amplitudeMax: 26,
    // How fast the sway oscillates. Lower = slower, dreamier wobble.
    frequencyMin: 0.4,
    frequencyMax: 1.1,
  },

  // Chance (0-1) that a newly spawned bubble drifts diagonally instead
  // of travelling mostly straight up.
  diagonalDriftChance: 0.35,
  // Maximum horizontal drift speed (px/sec) applied when a bubble is
  // drifting diagonally.
  maxDiagonalDrift: 22,

  // --------------------------------------------------------------------
  // VISUAL STYLE
  // --------------------------------------------------------------------
  // The background gradient colours. Feel free to swap these hex values
  // for your own palette -- the animation logic doesn't care what the
  // colours are, only how many there are.
  backgroundGradientColors: [
    '#fbe0dd', // blush pink
    '#fde3cf', // peach
    '#f8c3b0', // pale coral
    '#fbead9', // apricot-cream
    '#fff8ef', // warm cream
  ],

  // How long (seconds) one full loop of the background's slow colour
  // drift animation takes. Bigger = slower, calmer, more subtle.
  backgroundAnimationDurationSec: 28,

  // --------------------------------------------------------------------
  // SOUND
  // --------------------------------------------------------------------
  sound: {
    enabledByDefault: true,
    defaultVolume: 0.55,        // 0.0 - 1.0
    defaultStyle: 'classic',    // 'classic' | 'soft' | 'playful'
    pitchVariationEnabled: true,
    // How much size affects pitch. 1.0 = full effect, 0 = no effect.
    pitchVariationAmount: 1.0,
  },

  // --------------------------------------------------------------------
  // MISC TIMING
  // --------------------------------------------------------------------
  // How long the pop animation takes from burst to fully gone (ms).
  popAnimationDurationMs: 420,

  // The intro message is dismissed after the very first pop/drag pop.
  // This key is what we store in localStorage-less memory (session only,
  // per the "no persistence needed" nature of a toy) to track that.
  introDismissFlag: 'justBubblesIntroSeen',
};

// Expose globally so every other script (loaded via <script> tags, no
// bundler) can read it as `window.CONFIG` or simply `CONFIG`.
window.CONFIG = CONFIG;
