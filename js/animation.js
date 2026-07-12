/**
 * ============================================================================
 * ANIMATION.JS
 * ============================================================================
 * WHAT THIS FILE DOES:
 * Runs the single requestAnimationFrame loop that moves every active
 * bubble a little bit each frame: rising, wobbling side to side, and
 * drifting diagonally, plus removing bubbles that have floated off the
 * top of the container.
 *
 * WHY IT EXISTS:
 * Keeping "how bubbles move" separate from "what a bubble is" (bubbles.js)
 * and "when bubbles are created" (app.js) means the movement/physics code
 * has one job and is easy to tune in isolation.
 *
 * HOW IT WORKS:
 * A single rAF loop reads the elapsed time since the last frame (delta
 * time), then updates each bubble's x/y based on its own speed, drift
 * and wobble values, and writes the result to the DOM via a CSS
 * `transform: translate(...)`. Using `transform` (rather than top/left)
 * keeps this on the GPU-accelerated compositing path for smooth motion
 * even with many bubbles on screen, per the brief's performance goals.
 *
 * WHAT YOU CAN SAFELY CUSTOMISE:
 * The wobble/drift *math* lives here; the wobble/drift *ranges* live in
 * config.js. Prefer tuning config.js first.
 * ============================================================================
 */

const Animation = (() => {

  let container = null;
  let rafHandle = null;
  let lastFrameTime = null;
  let isPaused = false;

  /**
   * Moves a single bubble forward by `deltaSeconds` of simulated time,
   * updating its DOM transform. Removes (pops silently, no sound) any
   * bubble that has drifted fully off the top of the container --
   * these were never "popped" by the user, they've simply floated away.
   */
  function updateBubble(bubble, deltaSeconds, elapsedSeconds, containerRect) {
    // Rising motion.
    bubble.y += bubble.verticalSpeed * deltaSeconds;

    // Diagonal drift (constant horizontal component).
    bubble.x += bubble.horizontalDrift * deltaSeconds;

    // Organic side-to-side wobble layered on top of the drift, using a
    // sine wave so it oscillates smoothly rather than jittering.
    const wobbleOffset = Math.sin(elapsedSeconds * bubble.wobbleFrequency + bubble.wobblePhase)
      * bubble.wobbleAmplitude * deltaSeconds;
    bubble.x += wobbleOffset;

    // Apply the computed position to the DOM using the standalone CSS
    // `translate` property (NOT `transform`). This is deliberate: the
    // pop/burst animation in styles.css animates `scale`, and CSS
    // keyframes replace the *entire* property they target. If position
    // were set via `transform` here, the pop animation's `transform:
    // scale(...)` would overwrite it and every popped bubble would jump
    // to the container's origin (top-left) for the duration of the pop.
    // Keeping position (`translate`) and pop effect (`scale`) as
    // separate CSS properties means they can animate independently
    // without clobbering each other.
    bubble.el.style.translate = `${bubble.x}px ${bubble.y}px`;

    // Bubbles that float fully above the top edge (or far off either
    // side) have "escaped" -- clean them up quietly, no pop animation
    // or sound, since the user never touched them.
    const escapedTop = bubble.y < -bubble.diameter * 1.5;
    const escapedSide = bubble.x < -bubble.diameter * 2 || bubble.x > containerRect.width + bubble.diameter * 2;

    if (escapedTop || escapedSide) {
      bubble.el.remove();
      BubbleManager.getActiveBubbles().delete(bubble.id);
    }
  }

  /**
   * The main animation frame callback. Computes delta time, updates all
   * active bubbles, and schedules the next frame.
   */
  function frame(timestampMs) {
    if (isPaused) {
      rafHandle = requestAnimationFrame(frame);
      return;
    }

    if (lastFrameTime === null) lastFrameTime = timestampMs;
    const deltaSeconds = Math.min((timestampMs - lastFrameTime) / 1000, 0.05); // clamp huge jumps (tab switches)
    const elapsedSeconds = timestampMs / 1000;
    lastFrameTime = timestampMs;

    const containerRect = container.getBoundingClientRect();

    BubbleManager.getActiveBubbles().forEach(bubble => {
      if (bubble.isPopping) return; // already handled by bubbles.js burst animation
      updateBubble(bubble, deltaSeconds, elapsedSeconds, containerRect);
    });

    rafHandle = requestAnimationFrame(frame);
  }

  return {

    /** Must be called once with the container element before starting. */
    init(containerEl) {
      container = containerEl;
    },

    /** Starts the animation loop. Safe to call only once. */
    start() {
      if (rafHandle !== null) return; // already running
      lastFrameTime = null;
      rafHandle = requestAnimationFrame(frame);
    },

    /** Stops the animation loop entirely (not currently used by the UI,
     * but provided for completeness / future teardown needs). */
    stop() {
      if (rafHandle !== null) {
        cancelAnimationFrame(rafHandle);
        rafHandle = null;
      }
    },

    /** Pauses movement in place -- bubbles stay exactly where they are. */
    pause() {
      isPaused = true;
    },

    /** Resumes movement from the current scene, per the brief's request. */
    resume() {
      isPaused = false;
      lastFrameTime = null; // avoid a big delta-time jump after the pause
    },

    isPaused() {
      return isPaused;
    },
  };
})();

window.Animation = Animation;
