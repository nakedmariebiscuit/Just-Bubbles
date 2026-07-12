/**
 * ============================================================================
 * APP.JS
 * ============================================================================
 * WHAT THIS FILE DOES:
 * The "glue" file. On page load it:
 *   1. Applies the background gradient from config.
 *   2. Initialises BubbleManager and Animation against the bubble
 *      container element.
 *   3. Starts the spawn loop (creating new bubbles over time).
 *   4. Wires up click / tap / drag interactions for popping bubbles.
 *   5. Builds the Controls panel and connects its callbacks to the
 *      spawn/animation/audio settings.
 *   6. Shows the one-time intro message and dismisses it after the
 *      user's first interaction.
 *
 * WHY IT EXISTS:
 * Every other module (bubbles.js, animation.js, audio.js, controls.js) is
 * self-contained and doesn't know about the others. app.js is the only
 * file that wires them together, which is what makes each of them easy
 * to test, replace or extend independently.
 *
 * HOW IT WORKS:
 * A single `AppState` object holds the "current settings" (which preset
 * is active for frequency/speed/size, whether we're paused) since these
 * can change at any time via the Controls panel. The spawn loop is a
 * simple `setInterval` that gets torn down and rebuilt whenever the
 * frequency preset changes, so timing changes take effect immediately.
 * ============================================================================
 */

(function initJustBubbles() {

  // --------------------------------------------------------------------
  // Live app state -- what the user has currently selected in Controls.
  // --------------------------------------------------------------------
  const AppState = {
    frequencyPreset: CONFIG.defaultSpawnPreset,
    speedPreset: CONFIG.defaultSpeedPreset,
    sizePreset: CONFIG.defaultSizePreset,
    isPaused: false,
    hasInteractedYet: false,
    spawnIntervalHandle: null,
  };

  let containerEl = null;
  let introEl = null;

  /** Builds the CSS custom properties that drive the animated background
   * gradient, using the palette + timing declared in config.js. */
  function applyBackgroundGradient() {
    const colors = CONFIG.backgroundGradientColors;
    const gradient = `linear-gradient(120deg, ${colors.join(', ')})`;
    document.documentElement.style.setProperty('--bg-gradient', gradient);
    document.documentElement.style.setProperty(
      '--bg-anim-duration',
      `${CONFIG.backgroundAnimationDurationSec}s`
    );
  }

  /** Returns the {sizeRange, speedRange} object bubbles.js expects, based
   * on AppState's currently-selected presets. */
  function getCurrentSpawnSettings() {
    return {
      sizeRange: CONFIG.sizePresets[AppState.sizePreset],
      speedRange: CONFIG.speedPresets[AppState.speedPreset],
    };
  }

  /** Spawns the number of bubbles configured for the current frequency
   * preset. There is no automatic population cap any more -- if the
   * screen gets too full, the Clear control resets it instantly and
   * intentionally, rather than bubbles auto-popping unexpectedly. */
  function spawnTick() {
    if (AppState.isPaused) return;

    const preset = CONFIG.spawnPresets[AppState.frequencyPreset];
    const settings = getCurrentSpawnSettings();

    for (let i = 0; i < preset.bubblesPerSpawn; i++) {
      BubbleManager.spawnBubble(settings);
    }
  }

  /** (Re)starts the spawn loop using the current frequency preset's
   * interval. Called on init and whenever the frequency changes. */
  function restartSpawnLoop() {
    if (AppState.spawnIntervalHandle !== null) {
      clearInterval(AppState.spawnIntervalHandle);
    }
    const preset = CONFIG.spawnPresets[AppState.frequencyPreset];
    AppState.spawnIntervalHandle = setInterval(spawnTick, preset.intervalMs);
  }

  /** Hides the one-time intro message. Safe to call more than once. */
  function dismissIntro() {
    if (AppState.hasInteractedYet) return;
    AppState.hasInteractedYet = true;
    if (introEl) {
      introEl.classList.add('is-hidden');
      // Remove from the DOM after its fade-out transition finishes so it
      // stops intercepting any layout/interaction entirely.
      window.setTimeout(() => introEl.remove(), 500);
    }
  }

  /**
   * Finds the nearest bubble element (if any) at the given point, using
   * document.elementFromPoint. Returns the bubble's id, or null.
   * Ignores bubbles that are already mid-pop.
   */
  function findBubbleIdAtPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const bubbleEl = el.closest('.bubble');
    if (!bubbleEl || bubbleEl.classList.contains('popping')) return null;

    // Match the DOM element back to its id by checking active bubbles.
    // (Bubbles don't store their id as a DOM attribute to keep the
    // element lightweight; a small reverse-lookup is cheap here since
    // the active bubble count is capped and small.)
    for (const [id, bubble] of BubbleManager.getActiveBubbles()) {
      if (bubble.el === bubbleEl) return id;
    }
    return null;
  }

  /** Pops whatever bubble is at the given point, if any. Returns true if
   * a bubble was popped. */
  function popAtPoint(x, y) {
    const id = findBubbleIdAtPoint(x, y);
    if (!id) return false;
    dismissIntro();
    BubbleManager.popBubble(id);
    return true;
  }

  // --------------------------------------------------------------------
  // Pointer interaction: click/tap pops a single bubble, and dragging
  // pops every bubble the pointer passes over (a satisfying "chain pop").
  // Implemented with Pointer Events so mouse, touch and pen all work
  // through one code path.
  // --------------------------------------------------------------------
  function setupInteractions() {
    let isDragging = false;

    containerEl.addEventListener('pointerdown', (e) => {
      isDragging = true;
      popAtPoint(e.clientX, e.clientY);
    });

    containerEl.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      // While actively dragging, only pointermove events with the
      // primary button/touch held down should count. `e.buttons` is 0
      // when nothing is pressed (covers stray moves after a pointerup
      // that the browser didn't fire cleanly).
      if (e.buttons === 0 && e.pointerType === 'mouse') {
        isDragging = false;
        return;
      }
      popAtPoint(e.clientX, e.clientY);
    });

    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
    window.addEventListener('pointercancel', () => {
      isDragging = false;
    });

    // Clicking empty space should do nothing (no ripple, no bubble
    // spawn, nothing) -- this is naturally already true since popAtPoint
    // only acts when a bubble element is actually found.
  }

  /** Wires the Controls panel to AppState + the relevant subsystems. */
  function setupControls() {
    Controls.init({
      onFrequencyChange(value) {
        AppState.frequencyPreset = value;
        restartSpawnLoop();
      },
      onSpeedChange(value) {
        AppState.speedPreset = value;
        // Only affects newly spawned bubbles, per the brief's intent --
        // existing bubbles keep their own already-assigned speed so
        // changing the setting never looks like a jarring global snap.
      },
      onSizeChange(value) {
        AppState.sizePreset = value;
      },
      onPauseToggle() {
        AppState.isPaused = !AppState.isPaused;
        if (AppState.isPaused) {
          Animation.pause();
        } else {
          Animation.resume();
        }
        return AppState.isPaused;
      },
      onClear() {
        BubbleManager.clearAll();
      },
      onSoundEnabledChange(enabled) {
        AudioSystem.setEnabled(enabled);
      },
      onVolumeChange(volume) {
        AudioSystem.setVolume(volume);
      },
      onSoundStyleChange(style) {
        AudioSystem.setStyle(style);
      },
      onPitchVariationChange(enabled) {
        AudioSystem.setPitchVariationEnabled(enabled);
      },
    });
  }

  /** Runs once the DOM is ready. */
  function start() {
    containerEl = document.getElementById('bubble-container');
    introEl = document.getElementById('intro-message');

    applyBackgroundGradient();

    BubbleManager.init(containerEl);
    Animation.init(containerEl);
    Animation.start();

    AudioSystem.setEnabled(CONFIG.sound.enabledByDefault);
    AudioSystem.setVolume(CONFIG.sound.defaultVolume);
    AudioSystem.setStyle(CONFIG.sound.defaultStyle);
    AudioSystem.setPitchVariationEnabled(CONFIG.sound.pitchVariationEnabled);

    setupInteractions();
    setupControls();
    restartSpawnLoop();

    // Seed the screen with a handful of bubbles immediately so the
    // experience feels alive the instant the page opens, rather than
    // starting empty and slowly filling up.
    const settings = getCurrentSpawnSettings();
    for (let i = 0; i < 6; i++) {
      BubbleManager.spawnBubble(settings);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
