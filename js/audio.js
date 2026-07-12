/**
 * ============================================================================
 * AUDIO.JS
 * ============================================================================
 * WHAT THIS FILE DOES:
 * Plays the "pop" sound whenever a bubble is popped, with support for
 * multiple sound styles, volume control, muting and size-based pitch
 * variation.
 *
 * WHY IT EXISTS AND WHY IT USES SYNTHESISED SOUND:
 * Rather than shipping fixed audio files (which would need real recorded
 * assets that can't be generated as part of this text-based build), every
 * pop sound is *synthesised on the fly* using the Web Audio API. This has
 * two nice side effects that fit the brief perfectly:
 *   1. Zero external asset files to manage, download, or go missing.
 *   2. Every pop can have subtle natural variation (pitch, tone, decay)
 *      without needing many separate audio files.
 *
 * If you'd rather use real recorded pop sounds, see the "HOW TO REPLACE
 * THESE SOUNDS WITH AUDIO FILES" section at the bottom of this file and
 * the README -- the AudioSystem.playPop() function is the only place
 * that needs to change.
 *
 * HOW IT WORKS:
 * A single shared AudioContext is created lazily (browsers require a user
 * gesture before audio can play, so we create/resume it on first
 * interaction). Each "style" is a small synth recipe built from
 * oscillators + noise + a fast volume envelope, which is what makes a
 * "pop" sound like a pop instead of a music note.
 *
 * WHAT YOU CAN SAFELY CUSTOMISE:
 * - Add a new style by adding a new function to `popRecipes` below and
 *   listing its name in `AudioSystem.availableStyles`.
 * - Volume, mute and pitch-variation defaults live in config.js.
 * ============================================================================
 */

const AudioSystem = (() => {

  // Lazily-created shared audio context. Created on first user gesture
  // (browsers block audio until the user has interacted with the page).
  let audioCtx = null;

  // Live settings, seeded from CONFIG defaults. controls.js updates these
  // as the user changes settings in the panel.
  const settings = {
    enabled: CONFIG.sound.enabledByDefault,
    volume: CONFIG.sound.defaultVolume,
    style: CONFIG.sound.defaultStyle,
    pitchVariationEnabled: CONFIG.sound.pitchVariationEnabled,
  };

  /**
   * Makes sure we have a live AudioContext. Must be called from inside a
   * user-triggered event handler the first time (click/tap/drag), which
   * is naturally the case here since sounds only ever play on pop.
   *
   * Browsers create AudioContexts in a "suspended" state until a user
   * gesture resumes them, and `resume()` is asynchronous. Earlier this
   * function called `resume()` without waiting for it, which meant a
   * sound could be scheduled and immediately dropped if the context
   * hadn't actually finished waking up yet -- this was the cause of pop
   * sounds occasionally not playing, especially on the very first pop
   * or after the tab had been idle. Now `playPop()` waits for the
   * returned promise before scheduling anything.
   */
  function ensureContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtx();
    }
    return audioCtx;
  }

  /**
   * Builds a short burst of white noise as an AudioBufferSourceNode.
   * Used to give pops a light "fizzy" texture rather than a pure tone.
   */
  function createNoiseBurst(ctx, durationSec) {
    const bufferSize = Math.floor(ctx.sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Fade the noise out across its own duration so it doesn't click.
      const fade = 1 - i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * fade;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  /**
   * Each "recipe" describes how to build one style of pop using
   * oscillators + a noise burst + a fast volume envelope. `pitchMultiplier`
   * is the size-based pitch adjustment computed by getPitchMultiplier().
   */
  const popRecipes = {

    // A bright, clean, classic "boop" -- a quick downward pitch sweep.
    classic(ctx, destination, pitchMultiplier) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const startFreq = 620 * pitchMultiplier;
      const endFreq = 180 * pitchMultiplier;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.09);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(1, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

      osc.connect(gain).connect(destination);
      osc.start(now);
      osc.stop(now + 0.14);
    },

    // A rounder, gentler pop with less high-end -- feels softer/quieter.
    soft(ctx, destination, pitchMultiplier) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sine';
      filter.type = 'lowpass';
      filter.frequency.value = 900 * pitchMultiplier;

      const startFreq = 340 * pitchMultiplier;
      const endFreq = 120 * pitchMultiplier;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.16);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.8, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(filter).connect(gain).connect(destination);
      osc.start(now);
      osc.stop(now + 0.23);
    },

    // A cheerful pop with a tiny upward "sparkle" flick at the end.
    playful(ctx, destination, pitchMultiplier) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noise = createNoiseBurst(ctx, 0.05);
      const noiseGain = ctx.createGain();

      osc.type = 'triangle';
      const startFreq = 500 * pitchMultiplier;
      const dipFreq = 260 * pitchMultiplier;
      const flickFreq = 780 * pitchMultiplier;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(dipFreq, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(flickFreq, now + 0.1);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.9, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      noiseGain.gain.setValueAtTime(0.25, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain).connect(destination);
      noise.connect(noiseGain).connect(destination);
      osc.start(now);
      osc.stop(now + 0.16);
      noise.start(now);
    },
  };

  /**
   * Converts a bubble's size into a subtle pitch multiplier: small
   * bubbles pop slightly higher, large bubbles slightly lower. Kept
   * gentle (roughly +/-25%) so it stays natural rather than cartoonish.
   *
   * @param {number} bubbleDiameter - the bubble's size in pixels
   */
  function getPitchMultiplier(bubbleDiameter) {
    if (!settings.pitchVariationEnabled) return 1;

    // Map the typical bubble diameter range (roughly 14 - 110px) onto a
    // pitch multiplier range (roughly 1.25 down to 0.8).
    const minSize = 14;
    const maxSize = 110;
    const t = Utils.clamp((bubbleDiameter - minSize) / (maxSize - minSize), 0, 1);
    const multiplier = Utils.lerp(1.25, 0.8, t);

    // A touch of randomness so identical-size bubbles don't sound
    // perfectly identical either.
    const jitter = Utils.randomBetween(-0.03, 0.03);
    const amount = CONFIG.sound.pitchVariationAmount;
    return 1 + (multiplier - 1 + jitter) * amount;
  }

  return {

    availableStyles: ['classic', 'soft', 'playful'],

    /** Enable/disable all pop sounds. */
    setEnabled(enabled) {
      settings.enabled = enabled;
    },

    /** Set master volume, 0.0 - 1.0. */
    setVolume(volume) {
      settings.volume = Utils.clamp(volume, 0, 1);
    },

    /** Switch which pop style plays: 'classic' | 'soft' | 'playful'. */
    setStyle(style) {
      if (popRecipes[style]) settings.style = style;
    },

    /** Toggle size-based pitch variation on/off. */
    setPitchVariationEnabled(enabled) {
      settings.pitchVariationEnabled = enabled;
    },

    getSettings() {
      return { ...settings };
    },

    /**
     * Plays a pop sound for a bubble of the given diameter. Safe to call
     * even if sound is disabled or the browser blocks audio -- it just
     * silently does nothing.
     *
     * @param {number} bubbleDiameter - size of the popped bubble in px
     */
    playPop(bubbleDiameter = 40) {
      if (!settings.enabled) return;

      try {
        const ctx = ensureContext();

        // The actual sound-building work, factored out so it can run
        // either immediately (context already running -- the common
        // case after the first pop) or once resume() has genuinely
        // finished (the first pop of the session, or after the browser
        // auto-suspended an idle context).
        const scheduleSound = () => {
          const destination = ctx.createGain();
          destination.gain.value = settings.volume;
          destination.connect(ctx.destination);

          const pitchMultiplier = getPitchMultiplier(bubbleDiameter);
          const recipe = popRecipes[settings.style] || popRecipes.classic;
          recipe(ctx, destination, pitchMultiplier);
        };

        if (ctx.state === 'running') {
          scheduleSound();
        } else {
          // Wait for the context to actually finish resuming before
          // scheduling audio, so the sound is never silently dropped.
          ctx.resume().then(scheduleSound).catch(err => {
            console.warn('Just Bubbles: could not resume audio.', err);
          });
        }
      } catch (err) {
        // Audio is a nice-to-have, never let it break the app.
        console.warn('Just Bubbles: could not play pop sound.', err);
      }
    },
  };

  /* --------------------------------------------------------------------
   * HOW TO REPLACE THESE SOUNDS WITH AUDIO FILES
   * --------------------------------------------------------------------
   * If you'd rather use recorded .mp3/.wav pop sounds instead of the
   * synthesised ones above:
   *   1. Drop your files into /assets/audio/, e.g. pop-classic.mp3,
   *      pop-soft.mp3, pop-playful.mp3.
   *   2. Replace the body of `playPop` with something like:
   *
   *        const audio = new Audio(`assets/audio/pop-${settings.style}.mp3`);
   *        audio.volume = settings.volume;
   *        if (settings.pitchVariationEnabled) {
   *          audio.playbackRate = getPitchMultiplier(bubbleDiameter);
   *        }
   *        audio.play();
   *
   *   3. Everything else (config, controls panel, pitch logic) keeps
   *      working exactly the same, since only playPop() needed to change.
   * ------------------------------------------------------------------ */
})();

window.AudioSystem = AudioSystem;
