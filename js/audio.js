/**
 * STARGATE: REMNANTS — Audio Manager  (Phase 8)
 *
 * Procedural audio entirely via Web Audio API — no external files required.
 * All sounds synthesised from oscillators, noise, filters, and envelopes.
 *
 * Public API
 * ──────────
 *   Audio.init()                  — call once after DOMContentLoaded
 *   Audio.setEnabled(bool)        — master mute toggle
 *   Audio.setMusicEnabled(bool)   — toggle background music only
 *   Audio.isEnabled()             — returns current enabled state
 *   Audio.play(soundId)           — play a one-shot SFX
 *   Audio.startMusic()            — begin ambient background track
 *   Audio.stopMusic()             — fade out and stop music
 *   Audio.onNavigate(scene)       — call when scene changes (plays nav click)
 *   Audio.onEvent(eventType)      — call for game events (danger, benefit, etc.)
 *   Audio.onGateActivate()        — kawoosh sound
 *   Audio.onResearch()            — research complete chime
 *   Audio.onCombat(won)           — combat start/end stings
 *   Audio.onGameOver(won)         — win/loss stings
 *
 * Sound IDs for Audio.play():
 *   'click'         — UI button press
 *   'nav'           — tab navigation
 *   'confirm'       — affirmative action (build, assign, etc.)
 *   'cancel'        — cancel / close
 *   'alert'         — inbound gate alert pulse
 *   'success'       — mission success
 *   'failure'       — mission failure
 *   'kawoosh'       — gate engage
 *   'chevron'       — chevron lock
 *   'research'      — research complete
 *   'danger'        — danger event
 *   'benefit'       — benefit event
 *   'combat_start'  — combat begin
 *   'win'           — game win sting
 *   'loss'          — game loss sting
 *   'intro_alarm'   — emergency alarm for intro
 *   'intro_boot'    — boot-up beeps
 *   'intro_wormhole'— wormhole open drone
 */

const Audio = (() => {

  // ── State ─────────────────────────────────────────────────────────────────

  let _ctx        = null;   // AudioContext
  let _masterGain = null;   // master volume node
  let _musicGain  = null;   // music sub-bus
  let _sfxGain    = null;   // SFX sub-bus

  let _enabled      = false;
  let _musicEnabled = true;

  let _musicNodes   = [];   // currently running music oscillators/nodes
  let _musicRunning = false;
  let _musicBus     = null; // pre-effects gain (recreated each startMusic)
  let _droneTimer   = null;
  let _chordTimer   = null;
  let _melodyTimer  = null;
  let _musicVol     = 0.6;  // 0–1 user-controlled music volume

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    // AudioContext is created lazily on first user gesture to comply with
    // autoplay policy. We set _enabled from saved state but don't start
    // the context until the user interacts.
    const saved = _loadPref();
    _enabled      = saved.enabled;
    _musicEnabled = saved.musicEnabled !== false;
    _musicVol     = saved.musicVol ?? 0.6;
    _syncUI();
  }

  function _ensureCtx() {
    if (_ctx) return true;
    try {
      _ctx        = new (window.AudioContext || window.webkitAudioContext)();
      _masterGain = _ctx.createGain();
      _sfxGain    = _ctx.createGain();
      _musicGain  = _ctx.createGain();

      _masterGain.gain.value = _enabled ? 1.0 : 0.0;
      _sfxGain.gain.value    = 0.70;
      _musicGain.gain.value  = _musicVol * 0.30;

      _sfxGain.connect(_masterGain);
      _musicGain.connect(_masterGain);
      _masterGain.connect(_ctx.destination);
      return true;
    } catch (e) {
      console.warn('[Audio] Web Audio API not available:', e);
      return false;
    }
  }

  function _resumeCtx() {
    if (_ctx && _ctx.state === 'suspended') {
      _ctx.resume().catch(() => {});
    }
  }

  // ── Preferences ───────────────────────────────────────────────────────────

  function _savePref() {
    try {
      localStorage.setItem('sgr_audio', JSON.stringify({
        enabled: _enabled, musicEnabled: _musicEnabled, musicVol: _musicVol,
      }));
    } catch (e) {}
  }

  function _loadPref() {
    try {
      const raw = localStorage.getItem('sgr_audio');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { enabled: false, musicEnabled: true, musicVol: 0.6 };
  }

  // ── Enable / disable ──────────────────────────────────────────────────────

  function setEnabled(on) {
    _enabled = on;
    _savePref();
    _syncUI();
    if (!_ensureCtx()) return;
    _resumeCtx();
    // Ramp master gain smoothly
    const now = _ctx.currentTime;
    _masterGain.gain.cancelScheduledValues(now);
    _masterGain.gain.setValueAtTime(_masterGain.gain.value, now);
    _masterGain.gain.linearRampToValueAtTime(on ? 1.0 : 0.0, now + 0.3);

    if (on && _musicEnabled && !_musicRunning) startMusic();
    if (!on && _musicRunning) stopMusic();
  }

  function setMusicEnabled(on) {
    _musicEnabled = on;
    _savePref();
    if (on && _enabled && !_musicRunning) startMusic();
    if (!on && _musicRunning) stopMusic();
  }

  function isEnabled()  { return _enabled; }

  // ── SFX helpers ──────────────────────────────────────────────────────────

  /** Create a simple envelope on a gain node */
  function _envelope(gainNode, attack, decay, sustain, release, duration) {
    const now = _ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1.0,     now + attack);
    gainNode.gain.linearRampToValueAtTime(sustain,  now + attack + decay);
    gainNode.gain.setValueAtTime(sustain,            now + duration - release);
    gainNode.gain.linearRampToValueAtTime(0,         now + duration);
  }

  /** Oscillator helper — creates, connects, starts, auto-stops */
  function _osc(freq, type, gain, duration, envOpts = {}) {
    if (!_ctx) return;
    const osc   = _ctx.createOscillator();
    const g     = _ctx.createGain();
    const { attack = 0.01, decay = 0.05, sustain = 0.7, release = 0.1 } = envOpts;
    osc.type      = type;
    osc.frequency.setValueAtTime(freq, _ctx.currentTime);
    g.gain.setValueAtTime(0, _ctx.currentTime);
    _envelope(g, attack, decay, sustain, release, duration);
    osc.connect(g);
    g.connect(_sfxGain);
    osc.start(_ctx.currentTime);
    osc.stop(_ctx.currentTime + duration + 0.05);
    return { osc, g };
  }

  /** White noise burst */
  function _noise(duration, gainVal = 0.3, bandpassFreq = null) {
    if (!_ctx) return;
    const bufSize  = _ctx.sampleRate * duration;
    const buffer   = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
    const data     = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const source   = _ctx.createBufferSource();
    source.buffer  = buffer;
    const g        = _ctx.createGain();
    g.gain.setValueAtTime(gainVal, _ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, _ctx.currentTime + duration);
    let out = source;
    if (bandpassFreq) {
      const bp   = _ctx.createBiquadFilter();
      bp.type    = 'bandpass';
      bp.frequency.value = bandpassFreq;
      bp.Q.value = 1.5;
      out.connect(bp);
      out = bp;
    }
    out.connect(g);
    g.connect(_sfxGain);
    source.start(_ctx.currentTime);
  }

  // ── Individual SFX definitions ────────────────────────────────────────────

  const _SFX = {

    click() {
      _osc(440, 'sine', 0.3, 0.08, { attack: 0.001, decay: 0.03, sustain: 0.2, release: 0.04 });
    },

    nav() {
      _osc(520, 'sine', 0.25, 0.10, { attack: 0.001, decay: 0.04, sustain: 0.15, release: 0.05 });
      setTimeout(() => _osc(680, 'sine', 0.15, 0.08, { attack: 0.001, decay: 0.04, sustain: 0.1, release: 0.04 }), 40);
    },

    confirm() {
      // Ascending two-tone
      _osc(440, 'sine', 0.25, 0.12, { attack: 0.005, decay: 0.04, sustain: 0.4, release: 0.06 });
      setTimeout(() => _osc(660, 'sine', 0.25, 0.14, { attack: 0.005, decay: 0.05, sustain: 0.4, release: 0.07 }), 100);
    },

    cancel() {
      _osc(400, 'sine', 0.2, 0.10, { attack: 0.005, decay: 0.04, sustain: 0.3, release: 0.06 });
      setTimeout(() => _osc(300, 'sine', 0.2, 0.10, { attack: 0.005, decay: 0.04, sustain: 0.3, release: 0.06 }), 80);
    },

    alert() {
      // Pulsing alert beep — two-tone, softened with triangle waves
      const freqs = [660, 880, 660, 880];
      freqs.forEach((f, i) => {
        setTimeout(() => _osc(f, 'triangle', 0.09, 0.14,
          { attack: 0.015, decay: 0.04, sustain: 0.35, release: 0.07 }), i * 140);
      });
    },

    success() {
      // Tri-tone ascending chime
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((f, i) => {
        setTimeout(() => _osc(f, 'sine', 0.28, 0.3,
          { attack: 0.01, decay: 0.08, sustain: 0.5, release: 0.15 }), i * 110);
      });
    },

    failure() {
      // Descending minor
      const notes = [392, 349.23, 293.66];
      notes.forEach((f, i) => {
        setTimeout(() => _osc(f, 'triangle', 0.25, 0.35,
          { attack: 0.01, decay: 0.08, sustain: 0.5, release: 0.18 }), i * 130);
      });
      setTimeout(() => _noise(0.5, 0.12, 200), 0);
    },

    chevron() {
      // Metallic clunk
      _osc(180, 'sawtooth', 0.3, 0.18,
        { attack: 0.002, decay: 0.06, sustain: 0.1, release: 0.08 });
      _noise(0.1, 0.2, 800);
    },

    kawoosh() {
      if (!_ctx) return;
      // Deep bass whomp + rising sweep + whoosh
      const now = _ctx.currentTime;

      // Sub bass thud
      const bass = _ctx.createOscillator();
      const bassG = _ctx.createGain();
      bass.type = 'sine';
      bass.frequency.setValueAtTime(60, now);
      bass.frequency.exponentialRampToValueAtTime(25, now + 0.8);
      bassG.gain.setValueAtTime(0, now);
      bassG.gain.linearRampToValueAtTime(0.8, now + 0.02);
      bassG.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      bass.connect(bassG); bassG.connect(_sfxGain);
      bass.start(now); bass.stop(now + 0.85);

      // Rising sweep
      const sweep = _ctx.createOscillator();
      const sweepG = _ctx.createGain();
      sweep.type = 'sawtooth';
      sweep.frequency.setValueAtTime(80, now + 0.05);
      sweep.frequency.exponentialRampToValueAtTime(1400, now + 0.45);
      sweepG.gain.setValueAtTime(0, now + 0.05);
      sweepG.gain.linearRampToValueAtTime(0.4, now + 0.15);
      sweepG.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      const lpf = _ctx.createBiquadFilter();
      lpf.type = 'lowpass'; lpf.frequency.value = 2000;
      sweep.connect(lpf); lpf.connect(sweepG); sweepG.connect(_sfxGain);
      sweep.start(now + 0.05); sweep.stop(now + 0.55);

      // Whoosh noise
      _noise(1.4, 0.35, 1200);

      // Teal shimmer tail
      setTimeout(() => {
        const shimmerNotes = [880, 1046.5, 1318.5];
        shimmerNotes.forEach((f, i) => {
          setTimeout(() => _osc(f, 'sine', 0.12, 0.8,
            { attack: 0.04, decay: 0.1, sustain: 0.3, release: 0.5 }), i * 60);
        });
      }, 450);
    },

    research() {
      // Bright ascending scale — discovery feel
      const notes = [523.25, 587.33, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        setTimeout(() => _osc(f, 'sine', 0.22, 0.45,
          { attack: 0.02, decay: 0.08, sustain: 0.4, release: 0.3 }), i * 80);
      });
    },

    danger() {
      _osc(220, 'triangle', 0.13, 0.25,
        { attack: 0.01, decay: 0.06, sustain: 0.45, release: 0.12 });
      _noise(0.3, 0.07, 300);
    },

    benefit() {
      _osc(660, 'sine', 0.13, 0.22,
        { attack: 0.02, decay: 0.05, sustain: 0.45, release: 0.12 });
      setTimeout(() => _osc(880, 'sine', 0.09, 0.18,
        { attack: 0.02, decay: 0.04, sustain: 0.35, release: 0.1 }), 90);
    },

    combat_start() {
      // Tense staccato alarm
      [0, 150, 300, 450].forEach(t => {
        setTimeout(() => {
          _osc(330, 'square', 0.22, 0.10,
            { attack: 0.002, decay: 0.03, sustain: 0.5, release: 0.04 });
        }, t);
      });
      setTimeout(() => _noise(0.4, 0.18, 500), 0);
    },

    win() {
      if (!_ctx) return;
      // Triumphant ascending fanfare
      const melody = [
        [523.25, 0],    // C5
        [659.25, 150],  // E5
        [783.99, 300],  // G5
        [1046.5, 500],  // C6
        [783.99, 680],  // G5
        [880,    780],  // A5
        [1046.5, 900],  // C6
      ];
      melody.forEach(([f, t]) => {
        setTimeout(() => _osc(f, 'sine', 0.30, 0.5,
          { attack: 0.02, decay: 0.06, sustain: 0.55, release: 0.3 }), t);
      });
      // Pad underneath
      setTimeout(() => {
        [523.25, 659.25, 783.99].forEach(f => {
          _osc(f, 'triangle', 0.12, 1.6,
            { attack: 0.1, decay: 0.2, sustain: 0.4, release: 0.8 });
        });
      }, 500);
    },

    loss() {
      if (!_ctx) return;
      // Slow descending toll
      const notes = [440, 392, 349.23, 293.66];
      notes.forEach((f, i) => {
        setTimeout(() => {
          _osc(f, 'sine', 0.28, 0.8,
            { attack: 0.05, decay: 0.15, sustain: 0.4, release: 0.5 });
          _osc(f * 0.5, 'triangle', 0.12, 0.8,
            { attack: 0.05, decay: 0.15, sustain: 0.3, release: 0.5 });
        }, i * 500);
      });
      // Distant rumble
      setTimeout(() => _noise(2.0, 0.10, 80), 200);
    },

    intro_alarm() {
      if (!_ctx) return;
      // Claxon — alternating pitches
      const patt = [880, 660, 880, 660, 880];
      patt.forEach((f, i) => {
        setTimeout(() => {
          _osc(f, 'sawtooth', 0.30, 0.16,
            { attack: 0.002, decay: 0.02, sustain: 0.7, release: 0.05 });
        }, i * 180);
      });
    },

    intro_boot() {
      if (!_ctx) return;
      // Short ascending beeps — computer booting
      const seq = [220, 330, 440, 550, 440, 880];
      seq.forEach((f, i) => {
        setTimeout(() => {
          _osc(f, 'square', 0.12, 0.07,
            { attack: 0.001, decay: 0.02, sustain: 0.3, release: 0.03 });
        }, i * 90);
      });
    },

    intro_wormhole() {
      if (!_ctx) return;
      // Long low drone with shimmer — gate opening
      const now = _ctx.currentTime;
      // Sub drone
      const d1 = _ctx.createOscillator();
      const g1 = _ctx.createGain();
      d1.type = 'sine';
      d1.frequency.setValueAtTime(55, now);
      d1.frequency.linearRampToValueAtTime(60, now + 3);
      g1.gain.setValueAtTime(0, now);
      g1.gain.linearRampToValueAtTime(0.4, now + 0.5);
      g1.gain.setValueAtTime(0.4, now + 2.5);
      g1.gain.linearRampToValueAtTime(0, now + 4);
      d1.connect(g1); g1.connect(_sfxGain);
      d1.start(now); d1.stop(now + 4.1);

      // Harmonics shimmer
      [110, 165, 220].forEach((f, i) => {
        const d = _ctx.createOscillator();
        const g = _ctx.createGain();
        d.type = 'sine';
        d.frequency.setValueAtTime(f, now + 0.5 + i * 0.2);
        g.gain.setValueAtTime(0, now + 0.5 + i * 0.2);
        g.gain.linearRampToValueAtTime(0.12 - i * 0.03, now + 1 + i * 0.2);
        g.gain.linearRampToValueAtTime(0, now + 4);
        d.connect(g); g.connect(_sfxGain);
        d.start(now + 0.5); d.stop(now + 4.1);
      });

      // Noise wash
      _noise(4.0, 0.18, 400);
    },
  };

  // ── Public play ───────────────────────────────────────────────────────────

  function play(soundId) {
    if (!_enabled) return;
    if (!_ensureCtx()) return;
    _resumeCtx();
    const fn = _SFX[soundId];
    if (fn) fn();
    else console.warn('[Audio] Unknown sound:', soundId);
  }

  // ── Background Music ──────────────────────────────────────────────────────
  /**
   * Three independent generative layers, all routed through a shared
   * synthetic reverb + feedback delay chain for depth and space.
   *
   *  Drone  — two detuned low oscillators, cross-fading every 35–50s
   *  Chord  — open-fifth pad voicings from D minor pentatonic, every 10–18s
   *  Melody — sparse upper notes with late vibrato, every 6–14s
   *
   * All timing is randomised; layers never repeat in a perceptible pattern.
   */

  // D minor pentatonic across four registers (Hz)
  const _PENT = Object.freeze({
    low:  [73.42,  87.31,  98.00,  110.00, 130.81],  // D2 F2 G2 A2 C3
    mid:  [146.83, 174.61, 196.00, 220.00, 261.63],  // D3 F3 G3 A3 C4
    high: [293.66, 349.23, 392.00, 440.00, 523.25],  // D4 F4 G4 A4 C5
    top:  [587.33, 698.46, 784.00],                   // D5 F5 G5
  });

  // Open-fifth voicings: root–fifth pairs with octave doublings.
  // Spacious and harmonically stable — sounds ancient, not jarring.
  const _CHORDS = Object.freeze([
    [73.42,  110.00, 146.83, 220.00],   // D : D2 A2 D3 A3
    [87.31,  130.81, 174.61, 261.63],   // F : F2 C3 F3 C4
    [98.00,  146.83, 196.00, 293.66],   // G : G2 D3 G3 D4
    [110.00, 164.81, 220.00, 329.63],   // Am: A2 E3 A3 E4  (Dorian colour)
    [130.81, 196.00, 261.63, 392.00],   // C : C3 G3 C4 G4
  ]);

  function _rnd(min, max) { return min + Math.random() * (max - min); }
  function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /** Synthetic convolution reverb — exponentially decaying stereo noise IR */
  function _createReverb(decaySec) {
    const sr  = _ctx.sampleRate;
    const len = Math.floor(sr * decaySec);
    const ir  = _ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        d[i] = (Math.random() * 2 - 1)
             * Math.pow(Math.max(0, 1 - t), 2.2)
             * Math.exp(-t * 2.8);
      }
    }
    const conv  = _ctx.createConvolver();
    conv.buffer = ir;
    return conv;
  }

  /** Build shared reverb + delay effects chain (once per session) */
  function _setupMusicChain() {
    if (_musicBus) return;
    _musicBus = _ctx.createGain();
    _musicBus.gain.value = 1.0;

    // 3.2-second synthetic reverb
    const reverb = _createReverb(3.2);

    // Feedback delay: 420 ms tap, 30% feedback through a lowpass
    const delay   = _ctx.createDelay(2.0);
    const delayFB = _ctx.createGain();
    const delayLP = _ctx.createBiquadFilter();
    delay.delayTime.value   = 0.42;
    delayFB.gain.value      = 0.30;
    delayLP.type            = 'lowpass';
    delayLP.frequency.value = 1600;
    delay.connect(delayLP);
    delayLP.connect(delayFB);
    delayFB.connect(delay);  // feedback loop
    delay.connect(reverb);   // delay tail feeds reverb

    // Dry path (low level — most energy comes through reverb)
    const dry = _ctx.createGain();
    dry.gain.value = 0.20;
    _musicBus.connect(dry);
    dry.connect(_musicGain);

    // Reverb wet path
    const wet = _ctx.createGain();
    wet.gain.value = 0.70;
    _musicBus.connect(reverb);
    reverb.connect(wet);
    wet.connect(_musicGain);

    // Delay send (delay → reverb above)
    _musicBus.connect(delay);
  }

  // ── Layer 1: Drone ────────────────────────────────────────────────────────

  function _scheduleDrone() {
    if (!_musicRunning || !_ctx) return;
    const now     = _ctx.currentTime;
    const fadeIn  = 7.0;
    const hold    = _rnd(32, 52);
    const fadeOut = 8.0;
    const root    = _pick(_PENT.low);

    // Two detuned oscillators create slow beating / phasing
    [0, _rnd(-7, 7)].forEach((cents, i) => {
      const osc  = _ctx.createOscillator();
      const g    = _ctx.createGain();
      osc.type   = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(root * Math.pow(2, cents / 1200), now);

      // Very slow amplitude LFO (tremolo)
      const lfo  = _ctx.createOscillator();
      const lfoG = _ctx.createGain();
      lfo.frequency.setValueAtTime(_rnd(0.05, 0.13), now);
      lfoG.gain.setValueAtTime(root * 0.012, now);
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);

      const peak = _rnd(0.055, 0.10) * (i === 0 ? 1.0 : 0.6);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(peak, now + fadeIn);
      g.gain.setValueAtTime(peak, now + fadeIn + hold);
      g.gain.linearRampToValueAtTime(0, now + fadeIn + hold + fadeOut);

      osc.connect(g);
      g.connect(_musicBus);
      osc.start(now); lfo.start(now);
      osc.stop(now + fadeIn + hold + fadeOut + 0.1);
      lfo.stop(now + fadeIn + hold + fadeOut + 0.1);
      _musicNodes.push({ osc, g, lfo });
    });

    // Next drone overlaps during the fadeout for seamless crossfade
    _droneTimer = setTimeout(_scheduleDrone, (fadeIn + hold) * 1000);
  }

  // ── Layer 2: Chord pads ───────────────────────────────────────────────────

  function _scheduleChord() {
    if (!_musicRunning || !_ctx) return;
    const now     = _ctx.currentTime;
    const chord   = _pick(_CHORDS);
    const attack  = _rnd(2.5, 4.5);
    const hold    = _rnd(7, 15);
    const release = _rnd(4.0, 7.0);
    const total   = attack + hold + release;

    // Voice 2–3 notes (skip bottom or top occasionally for variety)
    const startIdx = Math.random() < 0.3 ? 1 : 0;
    const count    = 2 + Math.floor(Math.random() * 2);
    chord.slice(startIdx, startIdx + count).forEach((freq, i) => {
      const osc  = _ctx.createOscillator();
      const g    = _ctx.createGain();
      osc.type   = 'sine';
      // Tiny frequency drift for warmth (detuning in cents)
      osc.frequency.setValueAtTime(freq * Math.pow(2, _rnd(-2, 2) / 1200), now);
      osc.frequency.linearRampToValueAtTime(freq * Math.pow(2, _rnd(-2, 2) / 1200), now + total);

      // Higher notes slightly quieter (voice balance)
      const peak = _rnd(0.04, 0.07) * Math.pow(0.82, i);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(peak, now + attack);
      g.gain.setValueAtTime(peak, now + attack + hold);
      g.gain.linearRampToValueAtTime(0, now + total);

      osc.connect(g);
      g.connect(_musicBus);
      osc.start(now);
      osc.stop(now + total + 0.2);
      _musicNodes.push({ osc, g });
    });

    // Start next chord during the release of this one (legato feel)
    _chordTimer = setTimeout(_scheduleChord, (attack + hold + release * 0.55 + _rnd(1, 5)) * 1000);
  }

  // ── Layer 3: Melody ───────────────────────────────────────────────────────

  function _scheduleMelody() {
    if (!_musicRunning || !_ctx) return;
    const now = _ctx.currentTime;

    // ~30% chance of a rest — silence is part of the music
    if (Math.random() > 0.30) {
      const pool = Math.random() < 0.72
        ? _PENT.high
        : [..._PENT.mid.slice(-2), ..._PENT.top.slice(0, 2)];
      const freq = _pick(pool);
      const atk  = _rnd(0.8, 2.0);
      const dur  = _rnd(2.5, 5.5);

      const osc  = _ctx.createOscillator();
      const g    = _ctx.createGain();
      const filt = _ctx.createBiquadFilter();
      osc.type           = Math.random() < 0.65 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      filt.type          = 'lowpass';
      filt.frequency.value = freq * 5; // gentle high-frequency rolloff

      // Late vibrato — kicks in after the attack settles
      const vib  = _ctx.createOscillator();
      const vibG = _ctx.createGain();
      vib.frequency.setValueAtTime(_rnd(3.5, 5.5), now);
      vibG.gain.setValueAtTime(0, now);
      vibG.gain.linearRampToValueAtTime(freq * 0.004, now + atk + 0.6);
      vib.connect(vibG);
      vibG.connect(osc.frequency);
      vib.start(now);

      const peak = _rnd(0.05, 0.10);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(peak, now + atk);
      g.gain.setValueAtTime(peak, now + dur - _rnd(1.0, 2.0));
      g.gain.linearRampToValueAtTime(0, now + dur);

      osc.connect(filt);
      filt.connect(g);
      g.connect(_musicBus);
      osc.start(now);
      osc.stop(now + dur + 0.2);
      vib.stop(now + dur + 0.2);
      _musicNodes.push({ osc, g, lfo: vib });
    }

    _melodyTimer = setTimeout(_scheduleMelody, _rnd(6, 14) * 1000);
  }

  // ── Music control ─────────────────────────────────────────────────────────

  function startMusic() {
    if (_musicRunning) return;
    if (!_enabled || !_musicEnabled) return;
    if (!_ensureCtx()) return;
    _resumeCtx();
    _musicRunning = true;
    _setupMusicChain();

    // Stagger layer entry so the music builds up gradually
    _droneTimer  = setTimeout(_scheduleDrone,  800);
    _chordTimer  = setTimeout(_scheduleChord,  _rnd(4000, 7000));
    _melodyTimer = setTimeout(_scheduleMelody, _rnd(10000, 16000));
  }

  function stopMusic() {
    _musicRunning = false;
    [_droneTimer, _chordTimer, _melodyTimer].forEach(t => t && clearTimeout(t));
    _droneTimer = _chordTimer = _melodyTimer = null;
    _musicBus   = null; // recreate chain on next startMusic
    if (!_ctx) return;
    const now = _ctx.currentTime;
    _musicNodes.forEach(({ osc, lfo, g }) => {
      try {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(0, now + 3.5);
        osc.stop(now + 3.6);
        if (lfo) lfo.stop(now + 3.6);
      } catch (e) {}
    });
    _musicNodes = [];
  }

  function setMusicVolume(v) {
    _musicVol = Math.max(0, Math.min(1, v));
    _savePref();
    if (!_ctx || !_musicGain) return;
    const now = _ctx.currentTime;
    _musicGain.gain.cancelScheduledValues(now);
    _musicGain.gain.setValueAtTime(_musicGain.gain.value, now);
    _musicGain.gain.linearRampToValueAtTime(_musicVol * 0.30, now + 0.08);
  }

  function getMusicVolume() { return _musicVol; }

  // ── Semantic event hooks ──────────────────────────────────────────────────

  function onNavigate(scene) {
    play('nav');
  }

  function onEvent(type) {
    if (type === 'danger')  play('danger');
    if (type === 'benefit') play('benefit');
    if (type === 'alert')   play('alert');
  }

  function onGateActivate() {
    play('kawoosh');
  }

  function onChevronLock() {
    play('chevron');
  }

  function onResearch() {
    play('research');
  }

  function onCombat(won) {
    if (won === undefined) play('combat_start');
    else if (won)          play('success');
    else                   play('failure');
  }

  function onGameOver(won) {
    stopMusic();
    setTimeout(() => play(won ? 'win' : 'loss'), 600);
  }

  // ── UI sync ───────────────────────────────────────────────────────────────

  function _syncUI() {
    // Sync all known sound toggles in the DOM
    const els = document.querySelectorAll(
      '#sound-toggle, #igm-sound-toggle, #opt-sound, .audio-music-toggle'
    );
    els.forEach(el => {
      if (el.type === 'checkbox') el.checked = _enabled;
    });

    // Audio button state
    const btn = document.getElementById('audio-btn');
    if (btn) {
      btn.textContent = _enabled ? '🔊' : '🔇';
      btn.classList.toggle('audio-muted', !_enabled);
      btn.title = _enabled ? 'Mute' : 'Unmute';
    }

    // Music volume slider
    const slider = document.getElementById('igm-music-vol');
    if (slider) slider.value = Math.round(_musicVol * 100);
    const label = document.getElementById('igm-music-vol-label');
    if (label)  label.textContent = Math.round(_musicVol * 100) + '%';
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    init,
    setEnabled,
    setMusicEnabled,
    isEnabled,
    play,
    startMusic,
    stopMusic,
    setMusicVolume,
    getMusicVolume,
    onNavigate,
    onEvent,
    onGateActivate,
    onChevronLock,
    onResearch,
    onCombat,
    onGameOver,
    // Exposed for external toggle sync
    _syncUI,
  };

})();
