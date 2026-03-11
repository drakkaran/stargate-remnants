/**
 * STARGATE: REMNANTS — Wormhole
 * Wormhole animation controller using SVG and CSS.
 * Manages the event horizon visual, iris state, and vortex/kawoosh effect.
 *
 * States:
 *   idle         → gate is inactive (no animation)
 *   dialing      → chevrons lighting up one by one
 *   kawoosh      → initial wormhole burst (short, violent)
 *   active        → stable wormhole / shimmering event horizon
 *   closing      → vortex collapses inward
 */

const Wormhole = (() => {

  let _state      = 'idle';    // idle | dialing | kawoosh | active | closing
  let _onComplete = null;      // callback fired when kawoosh animation finishes
  let _kawooshTimer = null;
  let _closeTimer   = null;

  // ── Ring spin state ───────────────────────────────────────────────────────
  let _ringAngle  = 0;         // current absolute rotation of inner ring (degrees)
  let _isSpinning = false;

  // ── DOM helpers ────────────────────────────────────────────────────────────

  const $id = id => document.getElementById(id);

  // ── State transitions ─────────────────────────────────────────────────────

  /**
   * Start the kawoosh sequence, then settle into active state.
   * @param {Function} [onComplete] called when stable wormhole is established
   */
  function engage(onComplete) {
    _onComplete = onComplete ?? null;
    _state      = 'kawoosh';

    const gateEl = $id('wormhole-gate');
    const iris   = $id('wh-event-horizon');
    const vortex = $id('wh-vortex');
    const burst  = $id('wh-kawoosh-burst');

    if (!gateEl) return;

    // Phase 8: Audio kawoosh
    if (typeof Audio !== 'undefined') Audio.onGateActivate();

    // Reset classes
    gateEl.dataset.state = 'kawoosh';
    iris?.classList.add('wh-active');
    burst?.classList.add('wh-burst-active');

    // After kawoosh burst (1.4s), settle to active shimmer
    _kawooshTimer = setTimeout(() => {
      burst?.classList.remove('wh-burst-active');
      gateEl.dataset.state = 'active';
      _state = 'active';
      if (_onComplete) {
        _onComplete();
        _onComplete = null;
      }
    }, 1400);
  }

  /**
   * Close the wormhole — iris collapses.
   * @param {Function} [onComplete]
   */
  function close(onComplete) {
    if (_state === 'idle') { if (onComplete) onComplete(); return; }
    _state = 'closing';

    const gateEl = $id('wormhole-gate');
    const iris   = $id('wh-event-horizon');
    const burst  = $id('wh-kawoosh-burst');

    if (gateEl) gateEl.dataset.state = 'closing';
    burst?.classList.remove('wh-burst-active');

    _closeTimer = setTimeout(() => {
      iris?.classList.remove('wh-active');
      if (gateEl) gateEl.dataset.state = 'idle';
      _state = 'idle';
      if (onComplete) onComplete();
    }, 800);
  }

  /**
   * Abort any active animations and snap to idle.
   */
  function abort() {
    if (_kawooshTimer) clearTimeout(_kawooshTimer);
    if (_closeTimer)   clearTimeout(_closeTimer);
    const gateEl = $id('wormhole-gate');
    const iris   = $id('wh-event-horizon');
    const burst  = $id('wh-kawoosh-burst');
    iris?.classList.remove('wh-active');
    burst?.classList.remove('wh-burst-active');
    if (gateEl) gateEl.dataset.state = 'idle';
    _state      = 'idle';
    _ringAngle  = 0;
    _isSpinning = false;
    const ringEl = $id('gate-ring-inner');
    if (ringEl) {
      ringEl.style.transition = 'none';
      ringEl.style.transform  = 'rotate(0deg)';
    }
  }

  /**
   * Trigger a dialing-chevron lock animation for chevron N.
   * @param {number} chevronIndex 1–9
   */
  function lockChevron(chevronIndex) {
    const el = document.querySelector(`.gate-chevron[data-index="${chevronIndex}"]`);
    if (el) {
      el.classList.remove('chevron-locked');
      void el.offsetWidth; // force reflow
      el.classList.add('chevron-locked');
    }
    // Phase 8: Audio chevron lock
    if (typeof Audio !== 'undefined') Audio.onChevronLock();
  }

  /**
   * Reset all chevrons to unlocked state and return ring to home position.
   */
  function resetChevrons() {
    document.querySelectorAll('.gate-chevron').forEach(el => {
      el.classList.remove('chevron-locked', 'chevron-dim');
    });
    _ringAngle  = 0;
    _isSpinning = false;
    const ringEl = document.getElementById('gate-ring-inner');
    if (ringEl) {
      ringEl.style.transition = 'transform 0.8s ease-in-out';
      ringEl.style.transform  = 'rotate(0deg)';
    }
  }

  /**
   * Spin the inner ring to bring symbolName to the top (encoding) position.
   * Calls onComplete when the ring arrives.
   * @param {string}   symbolName
   * @param {Function} [onComplete]
   * @param {boolean}  [fast]  use shorter duration (speed-dial)
   */
  function spinToSymbol(symbolName, onComplete, fast = false) {
    const symbols = dialableSymbols();
    const idx = symbols.findIndex(s => s.name === symbolName);
    if (idx < 0) { onComplete?.(); return; }

    const total = symbols.length; // 38
    // Angle of this symbol in the ring's local coordinate space (0° = top)
    const symbolAngle = (idx / total) * 360;

    // Target ring rotation to bring the symbol to screen top
    // symbolAngle + targetRingAngle ≡ 0° (mod 360)  →  targetRingAngle = -symbolAngle
    let target = -symbolAngle;

    // Choose nearest equivalent angle to minimise travel distance
    target += Math.round((_ringAngle - target) / 360) * 360;

    // Ensure at least a quarter turn so the spin is always visible
    if (Math.abs(target - _ringAngle) < 90) {
      target += (target >= _ringAngle) ? -360 : 360;
    }

    const prev     = _ringAngle;
    _ringAngle     = target;
    const absDelta = Math.abs(target - prev);

    const duration = fast
      ? Math.max(250, Math.min(700,  absDelta * 1.8))
      : Math.max(500, Math.min(1600, absDelta * 4.0));

    _isSpinning = true;
    const ringEl = document.getElementById('gate-ring-inner');
    if (ringEl) {
      ringEl.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
      ringEl.style.transform  = `rotate(${_ringAngle}deg)`;
    }

    setTimeout(() => {
      _isSpinning = false;
      onComplete?.();
    }, duration);
  }

  /** Returns true while the ring spin animation is in progress. */
  function isSpinning() { return _isSpinning; }

  /**
   * Dim all chevrons (dialing sequence aborted).
   */
  function dimChevrons() {
    document.querySelectorAll('.gate-chevron').forEach(el => {
      el.classList.add('chevron-dim');
    });
  }

  // ── Render the full wormhole SVG component ────────────────────────────────

  /**
   * Render the gate SVG + wormhole animation layers into the given container.
   * @param {string} containerId
   */
  function render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = _buildGateSVG();

    // Snap ring to current saved angle instantly (no animation) so
    // a re-render mid-spin doesn't reset position.
    if (_ringAngle !== 0) {
      const ringEl = document.getElementById('gate-ring-inner');
      if (ringEl) {
        ringEl.style.transition = 'none';
        ringEl.style.transform  = `rotate(${_ringAngle}deg)`;
      }
    }
  }

  function _buildGateSVG() {
    // 9 chevron positions evenly around the gate ring (top = index 1, clockwise).
    // Chevron 1 is at top — the "encoding" chevron where symbols lock.
    const chevrons = [];
    for (let i = 1; i <= 9; i++) {
      const angleDeg = -90 + (i - 1) * 40;
      const isTop    = i === 1;
      chevrons.push(`
        <div class="gate-chevron ${isTop ? 'chevron-top' : ''}" data-index="${i}"
             style="transform: rotate(${angleDeg}deg) translateY(-132px) rotate(${-angleDeg}deg)">
          <div class="chevron-body">
            <div class="chevron-tip"></div>
          </div>
        </div>`);
    }

    return `
      <div id="wormhole-gate" class="wormhole-gate" data-state="idle">

        <!-- Fixed outer gate ring frame -->
        <div class="gate-ring-outer">
          <div class="gate-ring-inner-groove"></div>
        </div>

        <!-- Rotating inner symbol ring — spun by JS during dialing -->
        <div class="gate-ring-symbols" id="gate-ring-inner">
          ${_buildSymbolTrack()}
        </div>

        <!-- Fixed chevrons (9) mounted on outer ring -->
        <div class="gate-chevrons">
          ${chevrons.join('')}
        </div>

        <!-- Inner gate cavity -->
        <div class="gate-inner">

          <!-- Kawoosh burst layer -->
          <div id="wh-kawoosh-burst" class="wh-kawoosh-burst"></div>

          <!-- Stable event horizon -->
          <div id="wh-event-horizon" class="wh-event-horizon">
            <div class="wh-shimmer-1"></div>
            <div class="wh-shimmer-2"></div>
            <div class="wh-shimmer-3"></div>
            <div class="wh-depth-rings"></div>
          </div>

          <!-- Vortex layer (visible during kawoosh) -->
          <div id="wh-vortex" class="wh-vortex"></div>

          <!-- Gate inactive label -->
          <div class="gate-idle-label">
            <span>INACTIVE</span>
          </div>

        </div>

      </div>`;
  }

  function _buildSymbolTrack() {
    // Place 38 dialable symbols around the ring
    const symbols = dialableSymbols();
    const total   = symbols.length; // 38
    return symbols.map((sym, i) => {
      const angle = (i / total) * 360;
      return `
        <div class="gate-symbol" data-symbol="${sym.name}" data-id="${sym.id}"
             style="transform: rotate(${angle}deg) translateY(-114px) rotate(${-angle}deg)"
             title="${sym.name}">
          <span>${sym.glyph}</span>
        </div>`;
    }).join('');
  }

  function getState() { return _state; }

  return {
    engage,
    close,
    abort,
    lockChevron,
    resetChevrons,
    dimChevrons,
    render,
    getState,
    spinToSymbol,
    isSpinning,
  };

})();
