/**
 * STARGATE: REMNANTS — Save / Load
 * Browser localStorage persistence with 3 named slots + autosave.
 */

const Save = (() => {

  const PREFIX      = CONFIG.SAVE_KEY_PREFIX;   // 'sgr_save_'
  const SLOT_COUNT  = CONFIG.SAVE_SLOTS;         // 3
  const AUTOSAVE_MS = CONFIG.AUTOSAVE_INTERVAL_MS;

  let _autosaveTimer = null;

  // ── Helpers ─────────────────────────────────────────────────────────────

  function _key(slot) {
    return `${PREFIX}slot_${slot}`;
  }

  function _metaKey(slot) {
    return `${PREFIX}meta_${slot}`;
  }

  function _serializeState(state) {
    return JSON.stringify({ ...state, savedAt: Date.now() });
  }

  function _deserializeState(raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────

  return {
    /**
     * Save current state to a slot (1–3).
     * @param {number} slot
     * @returns {boolean} success
     */
    saveToSlot(slot) {
      if (slot < 1 || slot > SLOT_COUNT) return false;
      if (!State.isReady()) return false;

      const state = State.get();
      const serialized = _serializeState(state);

      const meta = {
        day:        state.day,
        hour:       state.hour,
        difficulty: state.difficulty,
        baseName:   state.baseName ?? 'Outpost Remnant',
        savedAt:    Date.now(),
        version:    state.version,
      };

      try {
        localStorage.setItem(_key(slot), serialized);
        localStorage.setItem(_metaKey(slot), JSON.stringify(meta));
        UI.refreshMenuSlots();
        UI.showNotification(`✓ Saved to Slot ${slot} — ${meta.baseName} · Day ${meta.day}`, 'success');
        return true;
      } catch (e) {
        console.error('[Save] Failed to write slot', slot, e);
        UI.showNotification('Save failed — storage may be full.', 'error');
        return false;
      }
    },

    /**
     * Load state from a slot.
     * @param {number} slot
     * @returns {boolean} success
     */
    loadFromSlot(slot) {
      if (slot < 1 || slot > SLOT_COUNT) return false;

      const raw = localStorage.getItem(_key(slot));
      if (!raw) {
        UI.showNotification(`Slot ${slot} is empty.`, 'warn');
        return false;
      }

      const restored = _deserializeState(raw);
      if (!restored) {
        UI.showNotification(`Slot ${slot} data is corrupted.`, 'error');
        return false;
      }

      State.load(restored);
      Engine.restart();
      UI.render();
      UI.showNotification(`Slot ${slot} loaded.`, 'success');
      return true;
    },

    /**
     * Delete a save slot.
     * @param {number} slot
     */
    deleteSlot(slot) {
      if (slot < 1 || slot > SLOT_COUNT) return;
      localStorage.removeItem(_key(slot));
      localStorage.removeItem(_metaKey(slot));
      UI.showNotification(`Slot ${slot} cleared.`, 'info');
    },

    /**
     * Return metadata for all slots (null if empty).
     * @returns {Array<object|null>}
     */
    getSlotMeta() {
      const metas = [];
      for (let i = 1; i <= SLOT_COUNT; i++) {
        const raw = localStorage.getItem(_metaKey(i));
        metas.push(raw ? JSON.parse(raw) : null);
      }
      return metas;
    },

    /**
     * Silently autosave to a dedicated autosave key (slot 0).
     */
    autosave() {
      if (!State.isReady()) return;
      const state = State.get();
      if (state.ui.menuOpen) return;   // don't autosave while menu is open
      try {
        localStorage.setItem(`${PREFIX}autosave`, _serializeState(state));
      } catch { /* silent */ }
    },

    /**
     * Load the autosave if it exists.
     * @returns {boolean}
     */
    loadAutosave() {
      const raw = localStorage.getItem(`${PREFIX}autosave`);
      if (!raw) return false;
      const restored = _deserializeState(raw);
      if (!restored) return false;
      State.load(restored);
      Engine.restart();
      UI.render();
      return true;
    },

    /**
     * Check whether any save data exists (for showing Resume button).
     * @returns {boolean}
     */
    hasSaveData() {
      for (let i = 1; i <= SLOT_COUNT; i++) {
        if (localStorage.getItem(_key(i))) return true;
      }
      return !!localStorage.getItem(`${PREFIX}autosave`);
    },

    /** Start the autosave interval timer. */
    startAutosave() {
      if (_autosaveTimer) clearInterval(_autosaveTimer);
      _autosaveTimer = setInterval(() => this.autosave(), AUTOSAVE_MS);
    },

    /** Stop the autosave interval timer. */
    stopAutosave() {
      if (_autosaveTimer) {
        clearInterval(_autosaveTimer);
        _autosaveTimer = null;
      }
    },
  };

})();
