/**
 * ============================================================================
 * UTILS.JS
 * ============================================================================
 * WHAT THIS FILE DOES:
 * A small toolbox of generic helper functions (random numbers, id
 * generation, math helpers) that don't belong to any single module but are
 * used by several of them.
 *
 * WHY IT EXISTS:
 * Keeps bubbles.js / animation.js / audio.js focused on their own job
 * instead of re-implementing the same "random number between X and Y"
 * style helper in three different places.
 *
 * HOW IT WORKS:
 * Plain functions attached to a `Utils` object on `window`, same pattern
 * as config.js.
 * ============================================================================
 */

const Utils = {

  /**
   * Returns a random floating point number between min (inclusive) and
   * max (exclusive).
   */
  randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  },

  /**
   * Returns a random integer between min and max, both inclusive.
   */
  randomIntBetween(min, max) {
    return Math.floor(Utils.randomBetween(min, max + 1));
  },

  /**
   * Returns true with the given probability (0-1).
   * e.g. Utils.chance(0.35) -> true about 35% of the time.
   */
  chance(probability) {
    return Math.random() < probability;
  },

  /**
   * Picks a random item out of an array.
   */
  randomFrom(array) {
    return array[Utils.randomIntBetween(0, array.length - 1)];
  },

  /**
   * Generates a short, unique-enough id for tagging bubble elements.
   * Not cryptographically unique, just unique enough to tell one
   * bubble's DOM node / timers apart from another's during a session.
   */
  createId() {
    return 'bubble-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  },

  /**
   * Clamps a number between a minimum and maximum.
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  /**
   * Linear interpolation between a and b by t (0-1). Used for smoothly
   * blending background gradient colours over time.
   */
  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  /**
   * Converts a hex colour (#rrggbb) into an {r,g,b} object so we can
   * interpolate between two colours channel by channel.
   */
  hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  },

  /**
   * Converts an {r,g,b} object back into a "rgb(r,g,b)" CSS string.
   */
  rgbToCss({ r, g, b }) {
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  },

  /**
   * Blends two hex colours together by t (0-1) and returns a CSS
   * rgb(...) string. Used by the animated background gradient.
   */
  blendHexColors(hexA, hexB, t) {
    const a = Utils.hexToRgb(hexA);
    const b = Utils.hexToRgb(hexB);
    return Utils.rgbToCss({
      r: Utils.lerp(a.r, b.r, t),
      g: Utils.lerp(a.g, b.g, t),
      b: Utils.lerp(a.b, b.b, t),
    });
  },
};

window.Utils = Utils;
