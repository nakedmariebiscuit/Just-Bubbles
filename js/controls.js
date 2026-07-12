/**
 * ============================================================================
 * CONTROLS.JS
 * ============================================================================
 * WHAT THIS FILE DOES:
 * Builds the small expandable controls panel (frequency, speed, size,
 * pause, clear, and all sound settings) and wires its inputs up to the
 * rest of the app via a callback object supplied by app.js.
 *
 * WHY IT EXISTS:
 * app.js shouldn't need to know how the panel is drawn, and the panel
 * shouldn't need to know how bubbles are spawned or animated -- it just
 * needs to report "the user changed X to Y". That's done here through a
 * small callbacks interface, keeping the two files loosely coupled.
 *
 * HOW IT WORKS:
 * `Controls.init(callbacks)` builds the DOM for the panel once, appends
 * it to <body>, and attaches event listeners that call the relevant
 * callback whenever an input changes. The panel starts collapsed (just a
 * small toggle button) so it stays out of the way of the bubbles, per
 * the brief's "clean and minimal" requirement.
 *
 * WHAT YOU CAN SAFELY CUSTOMISE:
 * - The preset button labels/options are read straight from config.js,
 *   so adding a new frequency/speed/size preset there will NOT
 *   automatically appear here (the labels below are intentionally
 *   explicit and human-friendly) -- add a matching button in
 *   buildPanelMarkup() if you add a new preset.
 * ============================================================================
 */

const Controls = (() => {

  let panelEl = null;
  let toggleEl = null;
  let isExpanded = false;
  let callbacks = {};

  /** Builds the full panel markup as an HTML string. */
  function buildPanelMarkup() {
    return `
      <div class="controls-section" role="group" aria-label="Bubble frequency">
        <h3 class="controls-heading">Frequency</h3>
        <div class="controls-button-row" data-setting="frequency">
          <button type="button" data-value="gentle" class="controls-btn">Gentle</button>
          <button type="button" data-value="playful" class="controls-btn">Playful</button>
          <button type="button" data-value="busy" class="controls-btn">Busy</button>
        </div>
      </div>

      <div class="controls-section" role="group" aria-label="Bubble speed">
        <h3 class="controls-heading">Speed</h3>
        <div class="controls-button-row" data-setting="speed">
          <button type="button" data-value="dreamy" class="controls-btn">Dreamy</button>
          <button type="button" data-value="breezy" class="controls-btn">Breezy</button>
          <button type="button" data-value="quick" class="controls-btn">Quick</button>
        </div>
      </div>

      <div class="controls-section" role="group" aria-label="Bubble size">
        <h3 class="controls-heading">Size</h3>
        <div class="controls-button-row" data-setting="size">
          <button type="button" data-value="tiny" class="controls-btn">Tiny</button>
          <button type="button" data-value="mixed" class="controls-btn">Mixed</button>
          <button type="button" data-value="big" class="controls-btn">Big</button>
        </div>
      </div>

      <div class="controls-section" role="group" aria-label="Sound settings">
        <h3 class="controls-heading">Sound</h3>

        <label class="controls-row controls-checkbox-row">
          <span>Pop sounds</span>
          <input type="checkbox" id="sound-enabled-toggle" checked>
        </label>

        <label class="controls-row">
          <span>Volume</span>
          <input type="range" id="sound-volume-slider" min="0" max="100" value="55" aria-label="Sound volume">
        </label>

        <div class="controls-button-row" data-setting="soundStyle">
          <button type="button" data-value="classic" class="controls-btn">Classic</button>
          <button type="button" data-value="soft" class="controls-btn">Soft</button>
          <button type="button" data-value="playful" class="controls-btn">Playful</button>
        </div>

        <label class="controls-row controls-checkbox-row">
          <span>Pitch variation</span>
          <input type="checkbox" id="pitch-variation-toggle" checked>
        </label>
      </div>

      <div class="controls-section controls-actions">
        <button type="button" id="pause-btn" class="controls-btn controls-btn-wide" aria-pressed="false">
          Pause
        </button>
        <button type="button" id="clear-btn" class="controls-btn controls-btn-wide">
          Clear
        </button>
      </div>
    `;
  }

  /** Marks the currently-active button within a button-row as selected. */
  function setActiveButton(rowSelector, value) {
    const row = panelEl.querySelector(`[data-setting="${rowSelector}"]`);
    if (!row) return;
    row.querySelectorAll('.controls-btn').forEach(btn => {
      const isActive = btn.dataset.value === value;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  /** Wires up a button-row (frequency/speed/size/soundStyle) to a callback. */
  function wireButtonRow(rowSelector, onSelect) {
    const row = panelEl.querySelector(`[data-setting="${rowSelector}"]`);
    if (!row) return;
    row.querySelectorAll('.controls-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setActiveButton(rowSelector, btn.dataset.value);
        onSelect(btn.dataset.value);
      });
    });
  }

  /** Toggles the panel between its collapsed "pill" and expanded states. */
  function togglePanel() {
    isExpanded = !isExpanded;
    panelEl.classList.toggle('is-expanded', isExpanded);
    toggleEl.setAttribute('aria-expanded', String(isExpanded));
    toggleEl.textContent = isExpanded ? 'Close ✕' : 'Controls ✧';
  }

  return {

    /**
     * Builds and attaches the panel. `cb` is an object of callbacks:
     * { onFrequencyChange, onSpeedChange, onSizeChange, onPauseToggle,
     *   onClear, onSoundEnabledChange, onVolumeChange, onSoundStyleChange,
     *   onPitchVariationChange }
     */
    init(cb) {
      callbacks = cb;

      const wrapper = document.createElement('div');
      wrapper.className = 'controls-wrapper';
      wrapper.innerHTML = `
        <button type="button" class="controls-toggle" aria-expanded="false" aria-controls="controls-panel">
          Controls ✧
        </button>
        <div class="controls-panel" id="controls-panel">
          ${buildPanelMarkup()}
        </div>
      `;
      document.body.appendChild(wrapper);

      toggleEl = wrapper.querySelector('.controls-toggle');
      panelEl = wrapper.querySelector('.controls-panel');

      toggleEl.addEventListener('click', togglePanel);

      // Frequency / Speed / Size preset rows.
      wireButtonRow('frequency', value => callbacks.onFrequencyChange?.(value));
      wireButtonRow('speed', value => callbacks.onSpeedChange?.(value));
      wireButtonRow('size', value => callbacks.onSizeChange?.(value));
      wireButtonRow('soundStyle', value => callbacks.onSoundStyleChange?.(value));

      // Sound toggle + volume slider.
      const soundToggle = panelEl.querySelector('#sound-enabled-toggle');
      soundToggle.addEventListener('change', () => {
        callbacks.onSoundEnabledChange?.(soundToggle.checked);
      });

      const volumeSlider = panelEl.querySelector('#sound-volume-slider');
      volumeSlider.addEventListener('input', () => {
        callbacks.onVolumeChange?.(Number(volumeSlider.value) / 100);
      });

      const pitchToggle = panelEl.querySelector('#pitch-variation-toggle');
      pitchToggle.addEventListener('change', () => {
        callbacks.onPitchVariationChange?.(pitchToggle.checked);
      });

      // Pause / Clear.
      const pauseBtn = panelEl.querySelector('#pause-btn');
      pauseBtn.addEventListener('click', () => {
        const nowPaused = callbacks.onPauseToggle?.();
        pauseBtn.textContent = nowPaused ? 'Resume' : 'Pause';
        pauseBtn.setAttribute('aria-pressed', String(!!nowPaused));
      });

      const clearBtn = panelEl.querySelector('#clear-btn');
      clearBtn.addEventListener('click', () => callbacks.onClear?.());

      // Reflect the defaults from config.js as the initially-active buttons.
      setActiveButton('frequency', CONFIG.defaultSpawnPreset);
      setActiveButton('speed', CONFIG.defaultSpeedPreset);
      setActiveButton('size', CONFIG.defaultSizePreset);
      setActiveButton('soundStyle', CONFIG.sound.defaultStyle);
      soundToggle.checked = CONFIG.sound.enabledByDefault;
      volumeSlider.value = Math.round(CONFIG.sound.defaultVolume * 100);
      pitchToggle.checked = CONFIG.sound.pitchVariationEnabled;
    },
  };
})();

window.Controls = Controls;
