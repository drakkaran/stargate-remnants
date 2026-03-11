/**
 * STARGATE: REMNANTS — UI
 * Screen management, day/night bar, resource display, notifications, menu.
 */

const UI = (() => {

  // ── DOM refs (populated after DOMContentLoaded) ───────────────────────

  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  let _notifTimer    = null;
  let _logCurrentDay = null;  // tracks the last day header written to #control-log

  // ── Screens ──────────────────────────────────────────────────────────────

  function showScreen(id) {
    $$('.screen').forEach(el => el.classList.remove('active'));
    const el = $(id);
    if (el) el.classList.add('active');
  }

  function hideScreen(id) {
    const el = $(id);
    if (el) el.classList.remove('active');
  }

  // ── Day/Night Bar ────────────────────────────────────────────────────────

  /**
   * Update the thin progress bar below the header.
   * @param {number} hour - 0 to 23
   */
  function updateDayNightBar(hour) {
    const bar  = $('day-night-bar');
    const glow = $('day-night-glow');
    if (!bar || !glow) return;

    const pct = (hour / CONFIG.HOURS_PER_DAY) * 100;
    glow.style.left = `${pct}%`;

    // Phase definitions: boundary, phase key, display label, indicator icon
    const PHASES = [
      { from:  4, to:  7, phase: 'dawn',  label: 'Dawn',  icon: '◑' },
      { from:  7, to: 18, phase: 'day',   label: 'Day',   icon: '☀' },
      { from: 18, to: 21, phase: 'dusk',  label: 'Dusk',  icon: '◐' },
    ];
    const p     = PHASES.find(p => hour >= p.from && hour < p.to)
               ?? { phase: 'night', label: 'Night', icon: '☽' };
    const phase = p.phase;

    bar.dataset.phase  = phase;
    glow.textContent   = p.icon;

    const hourLabel = $('time-label');
    if (hourLabel) {
      const state = State.isReady() ? State.get() : null;
      const day   = state ? state.day : 1;
      const h     = String(hour).padStart(2, '0');
      hourLabel.textContent = `Day ${day}  ·  ${h}:00  ·  ${p.label}`;
    }
  }

  // ── Resource Display ─────────────────────────────────────────────────────

  function updateResourceDisplay(s) {
    const r = s.resources;
    const cap = s.resourceCap;

    const fields = {
      'res-naquadah':    r.naquadah,
      'res-food':        r.food,
      'res-power':       r.power,
      'res-data':        r.data,
      'res-artifacts':   r.artifacts,
      'res-alloys':      r.alloys,
      'res-crystals':    r.crystals,
      'res-medicine':    r.medicine,
      'res-rareplants':  r.rarePlants,
      'res-advtech':     r.advancedTech,
      'res-anctech':     r.ancientTech,
      'res-nantech':     r.naniteTech,
    };

    Object.entries(fields).forEach(([id, val]) => {
      const el = $(id);
      if (!el) return;
      el.textContent = val;
      el.classList.toggle('res-full', val >= cap);
    });

    const capEl = $('res-cap');
    if (capEl) capEl.textContent = cap;

    // Power gen rate
    const powerGenEl = $('power-gen-rate');
    if (powerGenEl) {
      const gen = Engine.getPowerGen(s);
      const consuming = s.rooms.filter(r => !r.constructing && r.type !== 'gate_room' && r.type !== 'control_room').length;
      const net = gen - consuming;
      powerGenEl.textContent = `${net >= 0 ? '+' : ''}${net}/day`;
      powerGenEl.className = `power-net ${net >= 0 ? 'positive' : 'negative'}`;
    }
  }

  // ── Game Render ──────────────────────────────────────────────────────────

  function render() {
    if (!State.isReady()) return;
    const s = State.get();
    updateDayNightBar(s.hour);
    updateResourceDisplay(s);
    renderBase(s);
    renderPersonnel(s);
    renderLog(s);
    Resources.renderInventory(s);
    Armoury.renderScreen(s);
    Gate.renderScreen(s);
    Research.renderScreen(s);
    Crafting.renderScreen(s);
    _applyDevMode(s.ui.devMode);
    _syncNavButtons(s.ui.currentScene);
    _syncNavVisibility();
  }

  function renderBase(s) {
    Base.renderDiagram(s);
    Resources.renderInventory(s); // also updates #power-summary in Base scene
  }

  function renderPersonnel(s) {
    // Delegated to Personnel module — full Phase 3 card UI
    Personnel.renderScreen(s, null);
  }

  function renderLog(s) {
    const container = $('control-log');
    if (!container) return;
    container.innerHTML = '';

    // Newest at top — iterate newest→oldest, append in that order
    const entries = s.log.slice(-80).reverse();
    _logCurrentDay = entries.length > 0 ? entries[0].day : null;

    let groupDay = null;
    entries.forEach(entry => {
      if (entry.day !== groupDay) {
        container.appendChild(_makeDayHeader(entry.day));
        groupDay = entry.day;
      }
      container.appendChild(_makeLogEntry(entry));
    });
  }

  function appendLog(entry, container) {
    const c = container || $('control-log');
    if (!c) return;

    const entryEl = _makeLogEntry(entry);

    if (entry.day !== _logCurrentDay) {
      // New day: header + entry go to the very top
      c.prepend(entryEl);
      c.prepend(_makeDayHeader(entry.day));
      _logCurrentDay = entry.day;
    } else {
      // Same day: insert right after the top day header
      const hdr = c.firstChild;
      hdr && hdr.nextSibling
        ? c.insertBefore(entryEl, hdr.nextSibling)
        : c.appendChild(entryEl);
    }

    // Trim oldest from the bottom
    while (c.children.length > 120) c.removeChild(c.lastChild);
  }

  function _makeDayHeader(day) {
    const hdr = document.createElement('div');
    hdr.className   = 'log-day-header';
    hdr.dataset.day = String(day);
    hdr.textContent = `— Day ${day} —`;
    return hdr;
  }

  function _makeLogEntry(entry) {
    const div = document.createElement('div');
    div.className = `log-entry log-${entry.type}`;
    const h = String(entry.hour).padStart(2, '0');
    div.innerHTML = `<span class="log-time">${h}:00</span> ${entry.message}`;
    return div;
  }

  // ── Menu ─────────────────────────────────────────────────────────────────

  function openMenu() {
    const s = State.get();
    if (s) { s.ui.menuOpen = true; s.paused = true; }
    _refreshMenuSlots();
    $('in-game-menu')?.classList.add('open');
    $('menu-backdrop')?.classList.add('visible');
  }

  function closeMenu() {
    const s = State.get();
    if (s) { s.ui.menuOpen = false; s.paused = false; }
    $('in-game-menu')?.classList.remove('open');
    $('menu-backdrop')?.classList.remove('visible');
  }

  function _refreshMenuSlots() {
    const metas = Save.getSlotMeta();
    for (let i = 0; i < CONFIG.SAVE_SLOTS; i++) {
      const meta  = metas[i];
      const n     = i + 1;
      // Update both the load-screen slots and the in-game menu slots
      const ids   = [`menu-slot-${n}`, `igm-slot-${n}`];
      ids.forEach(id => {
        const el = $(id);
        if (!el) return;
        if (meta) {
          const d    = new Date(meta.savedAt);
          const time = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          el.innerHTML = `<span class="slot-name">${meta.baseName ?? 'Outpost Remnant'}</span>`
                       + `<span class="slot-detail">Slot ${n} &middot; Day ${meta.day} &middot; ${meta.difficulty} &middot; ${time}</span>`;
          el.dataset.filled = 'true';
        } else {
          el.innerHTML = `<span class="slot-name slot-name-empty">Slot ${n}</span>`
                       + `<span class="slot-detail">Empty</span>`;
          el.dataset.filled = 'false';
        }
      });
    }
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  function showNotification(message, type = 'info') {
    const el = $('notification');
    if (!el) return;
    el.textContent = message;
    el.className = `notification visible notif-${type}`;
    if (_notifTimer) clearTimeout(_notifTimer);
    _notifTimer = setTimeout(() => {
      el.classList.remove('visible');
    }, 3000);
  }

  // ── Game Over ─────────────────────────────────────────────────────────────

  function showGameOver(won) {
    const el = $('game-over-screen');
    if (!el) return;
    el.classList.toggle('win-state',  won);
    el.classList.toggle('loss-state', !won);
    const titleEl = $('game-over-title');
    if (titleEl) {
      titleEl.textContent = won ? 'MISSION COMPLETE' : 'ALL PERSONNEL LOST';
      titleEl.className   = won ? 'game-over-title-win' : 'game-over-title-loss';
    }
    const msgEl = $('game-over-msg');
    if (msgEl) {
      msgEl.innerHTML = won
        ? `<p>The Stargate pulses with power drawn from a ZPM charged over a million years.</p>
           <p>Seven chevrons lock. The kawoosh erupts — brighter and vaster than anything in this galaxy.</p>
           <p>The wormhole to Pegasus holds open. Your team steps through.</p>
           <p>You kept the light on. Whatever comes next — it begins here.</p>`
        : `<p>The base has fallen silent. Systems power down one by one in the dark.</p>
           <p>There are no more personnel to carry the mission forward.</p>
           <p>The gate room is empty. The gate still stands — patient, indifferent, eternal.</p>
           <p>Their sacrifice will not be forgotten.</p>`;
    }
    // Stats are injected by Events module into #game-over-stats
    // Phase 8: Audio game-over hook
    if (typeof Audio !== 'undefined') Audio.onGameOver(won);
    showScreen('game-over-screen');
  }

  // ── Dev mode ─────────────────────────────────────────────────────────────

  function _applyDevMode(on) {
    document.body.classList.toggle('dev-mode', on);
    const badge = $('dev-badge');
    if (badge) badge.style.display = on ? 'flex' : 'none';
  }

  // ── Nav tabs ─────────────────────────────────────────────────────────────

  function _syncNavButtons(scene) {
    $$('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.scene === scene);
    });
    $$('.scene-panel').forEach(panel => {
      panel.classList.toggle('active', panel.dataset.scene === scene);
    });
  }

  function _syncNavVisibility() {
    const s = State.isReady() ? State.get() : null;
    const nav = document.getElementById('main-nav');
    if (!nav) return;
    const offWorld = !!(s?.offWorld);
    nav.classList.toggle('nav-hidden', offWorld);
  }

  function navigateTo(scene) {
    const s = State.get();
    if (s) s.ui.currentScene = scene;
    _syncNavButtons(scene);
    _syncNavVisibility();
    // Phase 8: Audio nav hook
    if (typeof Audio !== 'undefined') Audio.onNavigate(scene);
    if (!State.isReady()) return;
    const st = State.get();
    if (scene === 'personnel')  { Personnel.renderScreen(st, null); Armoury.renderScreen(st); }
    if (scene === 'gate')       Gate.renderScreen(st);
    if (scene === 'research')   Research.renderScreen(st);
    if (scene === 'crafting')   Crafting.renderScreen(st);
  }

  // ── Resource Drawer ───────────────────────────────────────────────────────

  let _resDrawerOpen = false;

  function toggleResDrawer() {
    _resDrawerOpen = !_resDrawerOpen;
    const drawer = $('res-drawer');
    const btn    = $('res-toggle-btn');
    if (drawer) drawer.classList.toggle('open', _resDrawerOpen);
    if (btn)    btn.classList.toggle('open', _resDrawerOpen);
    // Refresh inventory when opening so values are current
    if (_resDrawerOpen && State.isReady()) Resources.renderInventory(State.get());
  }

  // ── Room icons — delegated to Base module ────────────────────

  function _roomIcon(type) {
    return Base.ROOMS[type]?.glyph ?? '?';
  }

  // ── Public ───────────────────────────────────────────────────────────────

  return {
    showScreen,
    hideScreen,
    updateDayNightBar,
    updateResourceDisplay,
    render,
    renderBase,
    renderPersonnel,
    renderLog,
    appendLog,
    openMenu,
    closeMenu,
    refreshMenuSlots: _refreshMenuSlots,
    showNotification,
    showGameOver,
    navigateTo,
    toggleResDrawer,
    syncNav: _syncNavVisibility,
  };

})();
