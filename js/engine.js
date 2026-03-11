/**
 * STARGATE: REMNANTS — Engine
 * Tick system, day/night cycle, and core game loop.
 * Resource processing delegated to Resources module.
 * Construction processing delegated to Base module.
 */

const Engine = (() => {

  let _tickTimer = null;

  // ── Tick ─────────────────────────────────────────────────────────────────

  function _tick() {
    if (!State.isReady()) return;
    const s = State.get();
    if (s.paused || s.flags.gameWon || s.flags.gameLost) return;

    s.tick++;

    // Advance time
    s.hour = (s.hour + 1) % CONFIG.HOURS_PER_DAY;
    if (s.hour === 0) {
      s.day++;
      _onNewDay(s);
    }

    // Per-tick production (hydroponics, research lab, etc.)
    const tickMsgs = Resources.processTick(s);
    tickMsgs.forEach(m => _log(s, 'info', m));

    // Construction countdowns (delegated to Base)
    const completed = Base.tickConstruction(s, (type, msg) => _log(s, type, msg));
    if (completed.length > 0) {
      UI.renderBase(s);
      // A room just finished — refresh whichever scene is visible, as it may
      // have been gated on that room (e.g. Research Lab unlocking Research screen).
      const scene = s.ui.currentScene;
      if (scene === 'research')  Research.renderScreen(s);
      if (scene === 'crafting')  Crafting.renderScreen(s);
      if (scene === 'personnel') Armoury.renderScreen(s);
      if (scene === 'gate')      Gate.renderScreen(s);
    }

    // Training & healing (delegated to Personnel module)
    Personnel.tickTraining(s, (type, msg) => _log(s, type, msg));
    Personnel.tickHealing(s, (type, msg) => _log(s, type, msg));

    // Refresh scene panels if visible
    if (s.ui.currentScene === 'personnel') {
      Personnel.renderScreen(s, null);
    }
    if (s.ui.currentScene === 'gate') {
      // Only lightweight refresh — full gate render is heavy
      // Just update status bar text if wormhole active
      const statusEl = document.querySelector('.gate-status-bar');
      if (statusEl && Wormhole.getState() === 'active') {
        const worldId = s.offWorld?.worldId;
        const def = worldId ? planetById(worldId) : null;
        if (def) statusEl.innerHTML = `<span class="gate-status-active">◉ WORMHOLE ACTIVE — ${def.name}</span>`;
      }
    }
    if (s.ui.currentScene === 'research') {
      Research.renderScreen(s);
    }
    if (s.ui.currentScene === 'crafting') {
      Crafting.renderScreen(s);
    }
    // Crafting
    _processCrafting(s);

    // Research
    _processResearch(s);

    // Random passive events (delegated to Events module)
    Events.tickPassive(s, (type, msg) => _log(s, type, msg));

    // Game-over check (delegated to Events module)
    Events.checkGameOver(s, (type, msg) => _log(s, type, msg));

    // UI refresh
    UI.updateDayNightBar(s.hour);
    UI.updateResourceDisplay(s);

    // Refresh construction timers in diagram without full re-render
    _updateBuildingTimers(s);
  }

  /** Called at midnight of each new day. */
  function _onNewDay(s) {
    const { foodLog, powerLog, hungerDeaths } = Resources.processDay(s);

    hungerDeaths.forEach(name => {
      _log(s, 'danger', `${name} has perished from starvation.`);
    });

    const type = hungerDeaths.length > 0 || s.resources.food === 0 ? 'danger' : 'info';
    _log(s, type, `Day ${s.day}: ${foodLog} ${powerLog}`);

    // Daily event checks
    Events.checkScripted(s, (t, m) => _log(s, t, m));
    Events.maybeInboundGate(s, (t, m) => _log(s, t, m));
  }

  // ── Crafting ─────────────────────────────────────────────────────────────

  function _processCrafting(s) {
    if (!s.crafting.inProgress) return;
    s.crafting.inProgress.hoursRemaining = Math.max(0, s.crafting.inProgress.hoursRemaining - 1);
    if (s.crafting.inProgress.hoursRemaining === 0) {
      // Delegate to Crafting module — handles item push, notification, log
      Crafting.onComplete(s, (type, msg) => _log(s, type, msg));
    }
  }

  // ── Research ─────────────────────────────────────────────────────────────

  function _processResearch(s) {
    if (!s.research.inProgress) return;
    s.research.inProgress.hoursRemaining = Math.max(0, s.research.inProgress.hoursRemaining - 1);
    if (s.research.inProgress.hoursRemaining === 0) {
      const id = s.research.inProgress.id;
      s.research.researched.push(id);
      s.research.inProgress = null;
      // Apply any immediate side-effects (flag unlocks, passive bonuses, etc.)
      Research.applyCompletionEffects(id, s, (type, msg) => _log(s, type, msg));
      // Refresh research screen if visible
      if (s.ui.currentScene === 'research') Research.renderScreen(s);
      // Phase 8: Audio hook
      if (typeof Audio !== 'undefined') Audio.onResearch();
    }
  }

  // ── Game Over check delegated to Events module ───────────────────────────

  // ── Log ───────────────────────────────────────────────────────────────────

  function _log(s, type, message) {
    s.log.push({ tick: s.tick, day: s.day, hour: s.hour, type, message });
    if (s.log.length > 200) s.log.splice(0, s.log.length - 200);
    UI.appendLog({ type, message, day: s.day, hour: s.hour });
  }

  // ── Building timer DOM update (lightweight, no full re-render) ──────────

  function _updateBuildingTimers(s) {
    s.rooms.forEach(r => {
      if (!r.constructing) return;
      const el = document.querySelector(`.building-timer[data-type="${r.type}"]`);
      if (el) el.textContent = `${r.hoursRemaining}h`;
    });
  }

  // ── Timer control ─────────────────────────────────────────────────────────

  function _start() {
    if (_tickTimer) clearInterval(_tickTimer);
    _tickTimer = setInterval(_tick, CONFIG.HOUR_DURATION_MS);
  }

  function _stop() {
    if (_tickTimer) {
      clearInterval(_tickTimer);
      _tickTimer = null;
    }
  }

  /**
   * Advance game time by n hours instantly (used by missions for duration).
   * Runs resource/construction/crafting/research/training/healing ticks without
   * firing random events or re-rendering the UI on every hour.
   * @param {number} n
   */
  function advanceHours(n) {
    if (!State.isReady()) return;
    const s = State.get();
    if (s.paused || s.flags.gameWon || s.flags.gameLost) return;

    for (let i = 0; i < n; i++) {
      s.tick++;
      s.hour = (s.hour + 1) % CONFIG.HOURS_PER_DAY;
      if (s.hour === 0) {
        s.day++;
        _onNewDay(s);
      }

      // Per-tick production (suppress routine messages to avoid log spam)
      Resources.processTick(s);

      Base.tickConstruction(s, (type, msg) => _log(s, type, msg));
      _processCrafting(s);
      _processResearch(s);
      Personnel.tickTraining(s, (type, msg) => _log(s, type, msg));
      Personnel.tickHealing(s, (type, msg) => _log(s, type, msg));
    }

    // Single UI refresh after all hours advance
    UI.updateDayNightBar(s.hour);
    UI.updateResourceDisplay(s);
    _updateBuildingTimers(s);
  }

  // ── Personnel generation ──────────────────────────────────────────────────

  // ── Public API ─────────────────────────────────────────────────────────────

  return {

    newGame(difficulty = 'normal', baseName = 'Outpost Remnant') {
      const s = State.init(difficulty);
      s.baseName = baseName;
      // Delegate crew generation to Personnel module (uses Names, archetypes, jitter)
      s.personnel   = Personnel.generateStartingCrew();
      s.resourceCap = Resources.calcCap(s);

      // Seed known worlds from planet database (decoded planets only at start)
      s.worlds = PLANET_DB
        .filter(def => def.decoded)
        .map(def => ({
          id:       def.id,
          name:     def.name,
          address:  def.address,
          decoded:  true,
          visited:  false,
          biome:    def.biome,
          description: def.description,
        }));

      // Initialise decoding records for all locked worlds
      Decoding.ensureState(s);

      _log(s, 'info', 'Base systems online. All cryo personnel revived. Assessing situation.');
      _log(s, 'info', 'Gate room active. Control room nominal. Power reserves critical.');
      _log(s, 'info', 'Intel analysis: 7 uncharted gate addresses detected in DHD partial memory. Decoding required.');

      _start();
      Save.startAutosave();
      UI.hideScreen('main-menu');
      UI.showScreen('game');
      UI.render();

      // Show tutorial help button once a game is running
      const tutBtn = document.getElementById('tut-help-btn');
      if (tutBtn) tutBtn.style.display = 'flex';

      // Phase 8: Intro sequence + tutorial
      if (typeof Intro !== 'undefined' && Intro.shouldShow(s)) {
        // Slight delay so game screen is fully rendered
        setTimeout(() => Intro.start(), 200);
      } else if (typeof Tutorial !== 'undefined' && Tutorial.shouldShow(s)) {
        setTimeout(() => Tutorial.start(), 400);
      } else {
        // Returning player — start music directly if sound on
        if (typeof Audio !== 'undefined' && Audio.isEnabled()) {
          setTimeout(() => Audio.startMusic(), 600);
        }
      }
    },

    restart() {
      _stop();
      _start();
      Save.startAutosave();
    },

    togglePause() {
      const s = State.get();
      if (!s) return;
      s.paused = !s.paused;
      return s.paused;
    },

    stop() {
      _stop();
      Save.stopAutosave();
    },

    advanceHours,

    log(type, message) {
      const s = State.get();
      if (s) _log(s, type, message);
    },

    getPowerGen(s) {
      return Resources.calcPowerGen(s);
    },

    roomLabel(type) {
      return Base.ROOMS[type]?.label ?? type;
    },
  };

})();
