/**
 * ============================================================================
 * BUBBLES.JS
 * ============================================================================
 * WHAT THIS FILE DOES:
 * Owns everything about an individual bubble's *existence*: creating its
 * DOM element with randomised visual properties, tracking its physics
 * state (position/speed/wobble), popping it (with the burst animation +
 * sound), and removing it from the DOM when it's gone.
 *
 * WHY IT EXISTS:
 * Separating "what a bubble is" (this file) from "how bubbles move every
 * frame" (animation.js) and "how many exist / when to spawn" (app.js)
 * keeps each file focused on one job, per the brief's request for
 * separated responsibilities.
 *
 * HOW IT WORKS:
 * `BubbleManager` keeps a Map of active bubbles (id -> bubble state
 * object). Each bubble state object holds both the plain data (position,
 * velocity, size...) and a reference to its DOM element, so animation.js
 * can update the element's transform every frame without doing DOM
 * lookups.
 *
 * WHAT YOU CAN SAFELY CUSTOMISE:
 * - Visual details of a bubble live in `buildBubbleElement()` below.
 * - Size/speed/wobble *ranges* live in config.js, not here.
 * - See the "FUTURE FEATURES" hook near the bottom for how to add new
 *   bubble types (golden, giant, splitting, etc.) without restructuring
 *   this file.
 * ============================================================================
 */

const BubbleManager = (() => {

  // Map of bubbleId -> bubble state object. This is the single source of
  // truth for "what bubbles currently exist".
  const activeBubbles = new Map();

  // The DOM element all bubbles are appended into. Set via init().
  let container = null;

  /**
   * Builds the actual DOM element for a bubble, including its layered
   * "look": a translucent glassy base, a soft rainbow sheen, and a
   * bright highlight to fake a glossy 3D soap-film surface.
   *
   * Everything here is pure CSS (see css/styles.css .bubble rules) --
   * this function just sets the per-bubble randomised values as inline
   * styles/CSS custom properties so every bubble looks slightly different.
   */
  function buildBubbleElement(diameter) {
    const el = document.createElement('div');
    el.className = 'bubble';

    // Slight per-bubble randomisation of the glossy look so bubbles of
    // the same size still don't feel identical (per the brief).
    const hueRotation = Utils.randomIntBetween(0, 360);
    const highlightX = Utils.randomIntBetween(22, 38); // % from left
    const highlightY = Utils.randomIntBetween(16, 30); // % from top
    const baseOpacity = Utils.randomBetween(0.55, 0.85);

    el.style.setProperty('--bubble-size', `${diameter}px`);
    el.style.setProperty('--bubble-hue', hueRotation);
    el.style.setProperty('--highlight-x', `${highlightX}%`);
    el.style.setProperty('--highlight-y', `${highlightY}%`);
    el.style.setProperty('--bubble-opacity', baseOpacity.toFixed(2));

    return el;
  }

  /**
   * Creates the little burst-of-light effect shown when a bubble pops.
   *
   * IMPORTANT: this is appended directly to the container as its own
   * independent element -- NOT as a child of the bubble being popped.
   * Nesting it inside the bubble was tried first and didn't work well:
   * CSS opacity multiplies down through nested elements, so as the
   * popping bubble faded toward opacity 0, it dragged the shimmer's own
   * opacity down with it, making the shimmer nearly invisible right when
   * it should have been brightest. As a sibling element with its own
   * independent opacity, the burst now reads clearly every time.
   *
   * @param {object} bubble - the bubble state object being popped
   */
  function createPopBurst(bubble) {
    const burst = document.createElement('div');
    burst.className = 'pop-burst';

    // Sized a little larger than the bubble itself so the burst reads
    // as an expansion beyond the bubble's own edges.
    const burstSize = bubble.diameter * 1.7;
    burst.style.setProperty('--burst-size', `${burstSize}px`);

    // Centre the burst on the bubble's last known position.
    const offset = (burstSize - bubble.diameter) / 2;
    burst.style.translate = `${bubble.x - offset}px ${bubble.y - offset}px`;

    container.appendChild(burst);

    // The burst is purely decorative and removes itself once its own
    // animation (see css/styles.css .pop-burst) finishes.
    window.setTimeout(() => burst.remove(), CONFIG.popAnimationDurationMs);
  }

  /**
   * Chooses a random spawn edge/position for a new bubble, based on the
   * container's current dimensions. Bubbles mostly enter from the
   * bottom (so they can rise), but occasionally enter from the left or
   * right edges for variety, as requested in the brief.
   */
  function chooseSpawnPosition(diameter, containerRect) {
    const roll = Math.random();

    if (roll < 0.75) {
      // Enter from the bottom, random horizontal position.
      return {
        x: Utils.randomBetween(0, Math.max(0, containerRect.width - diameter)),
        y: containerRect.height + diameter,
      };
    } else if (roll < 0.875) {
      // Enter from the left edge, partway up.
      return {
        x: -diameter,
        y: Utils.randomBetween(containerRect.height * 0.3, containerRect.height),
      };
    } else {
      // Enter from the right edge, partway up.
      return {
        x: containerRect.width + diameter,
        y: Utils.randomBetween(containerRect.height * 0.3, containerRect.height),
      };
    }
  }

  /**
   * Creates one new bubble: builds its DOM element, computes its initial
   * physics state (position, speed, wobble, drift), and registers it in
   * `activeBubbles`.
   *
   * @param {object} settings - current size/speed presets (from controls.js)
   * @returns {object} the newly created bubble state object
   */
  function spawnBubble(settings) {
    if (!container) {
      console.warn('Just Bubbles: BubbleManager.init() must be called first.');
      return null;
    }

    const { sizeRange, speedRange } = settings;
    const diameter = Utils.randomIntBetween(sizeRange.min, sizeRange.max);
    const containerRect = container.getBoundingClientRect();
    const spawnPos = chooseSpawnPosition(diameter, containerRect);

    const isDiagonal = Utils.chance(CONFIG.diagonalDriftChance);
    const horizontalDrift = isDiagonal
      ? Utils.randomBetween(-CONFIG.maxDiagonalDrift, CONFIG.maxDiagonalDrift)
      : Utils.randomBetween(-6, 6); // tiny natural drift even when "mostly upward"

    const id = Utils.createId();
    const el = buildBubbleElement(diameter);
    container.appendChild(el);

    const bubble = {
      id,
      el,
      diameter,
      x: spawnPos.x,
      y: spawnPos.y,
      // Negative = moving upward (screen y grows downward).
      verticalSpeed: -Utils.randomBetween(speedRange.minSpeed, speedRange.maxSpeed),
      horizontalDrift,
      // Wobble gives the organic side-to-side sway.
      wobbleAmplitude: Utils.randomBetween(CONFIG.wobble.amplitudeMin, CONFIG.wobble.amplitudeMax),
      wobbleFrequency: Utils.randomBetween(CONFIG.wobble.frequencyMin, CONFIG.wobble.frequencyMax),
      wobblePhase: Utils.randomBetween(0, Math.PI * 2),
      createdAt: performance.now(),
      isPopping: false,
    };

    activeBubbles.set(id, bubble);
    return bubble;
  }

  /**
   * Pops a bubble: plays the burst animation + sound, then removes it
   * from the DOM and from `activeBubbles` once the animation finishes.
   *
   * @param {string} id - bubble id
   * @param {object} [opts]
   * @param {boolean} [opts.silent] - skip sound (available for any
   *   future programmatic popping that shouldn't play audio; not
   *   currently used by any caller, since every pop today is a direct
   *   user interaction)
   */
  function popBubble(id, opts = {}) {
    const bubble = activeBubbles.get(id);
    if (!bubble || bubble.isPopping) return;

    bubble.isPopping = true;
    bubble.el.classList.add('popping');
    createPopBurst(bubble);

    if (!opts.silent) {
      AudioSystem.playPop(bubble.diameter);
    }

    // Remove from the "active for movement/collision" set immediately
    // so animation.js and hit-testing stop considering it, but leave the
    // DOM element in place for the duration of the burst animation.
    activeBubbles.delete(id);

    window.setTimeout(() => {
      bubble.el.remove();
    }, CONFIG.popAnimationDurationMs);
  }

  return {

    /** Must be called once with the container element before spawning. */
    init(containerEl) {
      container = containerEl;
    },

    spawnBubble,
    popBubble,

    /** Returns the live Map of active bubbles (for animation.js to iterate). */
    getActiveBubbles() {
      return activeBubbles;
    },

    getActiveCount() {
      return activeBubbles.size;
    },

    /**
     * Immediately removes every bubble with no burst animation -- used
     * by the "Clear" control for an instant clean screen. Also removes
     * any pop-burst effects still mid-animation from a just-popped
     * bubble, so Clear always leaves a genuinely empty screen.
     */
    clearAll() {
      activeBubbles.forEach(bubble => bubble.el.remove());
      activeBubbles.clear();
      container.querySelectorAll('.pop-burst').forEach(el => el.remove());
    },

    /* ------------------------------------------------------------------
     * FUTURE FEATURES HOOK
     * ------------------------------------------------------------------
     * The brief asks for the codebase to stay modular enough to support
     * future bubble variants (golden bubbles, rainbow bubbles, clusters,
     * giant bubbles, splitting bubbles, trails, sparkles, seasonal
     * themes) without implementing them yet.
     *
     * The natural extension point is here: `spawnBubble()` could accept
     * an optional `variant` argument (e.g. 'golden', 'giant') and:
     *   - add a matching CSS class in buildBubbleElement()
     *   - add matching visual rules in css/styles.css
     *   - optionally change physics (giant bubbles slower, golden
     *     bubbles worth a spark of confetti on pop, etc.) right here in
     *     the bubble state object.
     * `popBubble()` is the natural place to trigger variant-specific pop
     * effects (e.g. splitting into smaller bubbles by calling
     * `spawnBubble()` again from inside the pop handler).
     * ------------------------------------------------------------------ */
  };
})();

window.BubbleManager = BubbleManager;
