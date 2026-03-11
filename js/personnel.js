/**
 * STARGATE: REMNANTS — Personnel
 * Personnel generation, stat management, hunger damage, training hall,
 * med bay healing, item bonuses, assignment validation, and the full
 * personnel screen renderer.
 */

const Personnel = (() => {

  // ── Archetypes ─────────────────────────────────────────────────────────────
  // Three starting crew: combat-heavy, science-heavy, balanced.
  // Used to seed both stats and name rank flavour.

  const ARCHETYPES = Object.freeze({
    combat: {
      label:       'Combat Specialist',
      description: 'Hardened field operative. Excels in hostile engagements and tactical operations.',
      baseStats:   { combat: 8, diplomacy: 3, science: 2, survival: 6 },
      statJitter:  1,   // ±1 random variation per stat
      maxHealth:   110,
      callout:     '⚔',
    },
    science: {
      label:       'Science Officer',
      description: 'Brilliant researcher and technologist. Invaluable for analysis, decoding, and Ancient tech.',
      baseStats:   { combat: 2, diplomacy: 5, science: 9, survival: 3 },
      statJitter:  1,
      maxHealth:   90,
      callout:     '🔬',
    },
    balanced: {
      label:       'Field Commander',
      description: 'Versatile team leader with well-rounded capabilities across all mission types.',
      baseStats:   { combat: 5, diplomacy: 5, science: 5, survival: 5 },
      statJitter:  1,
      maxHealth:   100,
      callout:     '★',
    },
    // Recruitable archetypes (off-world)
    diplomat: {
      label:       'Diplomat',
      description: 'Specialist in inter-species relations and intelligence gathering.',
      baseStats:   { combat: 2, diplomacy: 9, science: 4, survival: 3 },
      statJitter:  1,
      maxHealth:   90,
      callout:     '🤝',
    },
    survivor: {
      label:       'Survival Expert',
      description: 'Master of wilderness operation. Keeps teams alive in the harshest conditions.',
      baseStats:   { combat: 5, diplomacy: 3, science: 3, survival: 9 },
      statJitter:  1,
      maxHealth:   105,
      callout:     '🌿',
    },
  });

  // ── Stat definitions ──────────────────────────────────────────────────────

  const STATS = Object.freeze([
    { key: 'combat',    label: 'Combat',    glyph: '⚔',  description: 'Effectiveness in hostile engagements and raids. Affects combat mission success and defence.' },
    { key: 'diplomacy', label: 'Diplomacy', glyph: '🤝', description: 'Skill in negotiation and inter-cultural relations. Affects trade, recruitment, and intel missions.' },
    { key: 'science',   label: 'Science',  glyph: '🔬', description: 'Research aptitude and technological understanding. Affects exploration, decoding, and lab output.' },
    { key: 'survival',  label: 'Survival', glyph: '🌿', description: 'Resilience and field craft. Reduces hunger damage. Affects resource-gathering and mining missions.' },
  ]);

  // ── Item definitions ──────────────────────────────────────────────────────
  // Defines how each item type modifies effective stats.

  const ITEM_DEFS = Object.freeze({
    // Armour
    kevlar_vest:     { label: 'Kevlar Vest',      glyph: '🛡', statBonus: { combat: 1 }, description: 'Standard-issue body armour. Reduces combat damage.' },
    tactical_armour: { label: 'Tactical Armour',  glyph: '⛨',  statBonus: { combat: 2, survival: 1 }, description: 'Heavy plate and ceramic composite. Significant combat boost.' },
    // Weapons
    zat_gun:         { label: "Zat'nik'tel",       glyph: '⚡', statBonus: { combat: 2 }, description: "Goa'uld stun weapon. First shot stuns, second kills." },
    plasma_cannon:   { label: 'Plasma Cannon',    glyph: '🔫', statBonus: { combat: 3 }, description: 'Heavy energy weapon salvaged from off-world. Devastating firepower.' },
    // Scanners
    long_range_scanner: { label: 'LR Scanner',    glyph: '📡', statBonus: { science: 2 }, description: 'Detects life signs and Ancient technology at range.' },
    data_pad:        { label: 'Data Pad',          glyph: '📱', statBonus: { science: 1, diplomacy: 1 }, description: 'Compact analysis unit. Helps in research and negotiation.' },
    // Medical
    medkit:          { label: 'Medical Kit',       glyph: '⛑',  statBonus: { survival: 2 }, description: 'Trauma kit with field surgery supplies. Boosts survival chances.' },
    stims:           { label: 'Combat Stims',      glyph: '💉', statBonus: { combat: 1, survival: 1 }, description: 'Adrenaline and coagulants. Short-duration performance boost.' },
    // Diplomatic
    universal_translator: { label: 'U-Translator', glyph: '💬', statBonus: { diplomacy: 3 }, description: 'Ancient-derived translation device. Opens diplomatic doors.' },
    // Ancient relics
    ancient_device:  { label: 'Ancient Device',   glyph: '⌬',  statBonus: { science: 3 }, description: 'Inscribed Ancient artefact. Boosts understanding of Ancient technology.' },
    // Found-only items (off-world recovery)
    gould_ribbon:          { label: "Goa'uld Ribbon Device", glyph: '☀', statBonus: { combat: 2, science: 1 }, description: "Recovered from a System Lord's vault. Requires workaround to operate." },
    tok_ra_symbiote_doc:   { label: "Tok'ra Communiqué",     glyph: '📜', statBonus: { diplomacy: 2, science: 1 }, description: "Diplomatic introduction from a Tok'ra operative." },
    nox_healing_plant:     { label: 'Nox Healing Plant',     glyph: '🌿', statBonus: { survival: 3 }, description: 'Living Nox plant that accelerates cellular repair far beyond any medicine.' },
  });

  // ── Generation ────────────────────────────────────────────────────────────

  /**
   * Generate a single personnel object.
   * @param {string} archetypeKey
   * @param {string} [idPrefix]
   * @param {GameState} [s]  — used for unique name check
   * @returns {PersonnelObj}
   */
  function generate(archetypeKey, idPrefix = 'p', s = null) {
    const arch = ARCHETYPES[archetypeKey] ?? ARCHETYPES.balanced;

    // Jitter each stat within ±statJitter, clamp to [1, MAX_STAT_LEVEL - 1]
    const stats = {};
    for (const [key, base] of Object.entries(arch.baseStats)) {
      const jitter = Math.floor(Math.random() * (arch.statJitter * 2 + 1)) - arch.statJitter;
      stats[key] = Math.max(1, Math.min(CONFIG.MAX_STAT_LEVEL - 1, base + jitter));
    }

    const name = s
      ? Names.generateUnique(s, archetypeKey)
      : Names.generate(archetypeKey);

    return {
      id:            `${idPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      archetype:     archetypeKey,
      health:        arch.maxHealth,
      maxHealth:     arch.maxHealth,
      stats,
      training:      null,     // { stat, hoursRemaining } | null
      healing:       null,     // { hoursRemaining } | null — med bay treatment
      item:          null,     // itemId | null — equipped item
      alive:         true,
      offWorld:      false,    // true while in a gate team off-world
    };
  }

  /**
   * Generate the 3 canonical starting crew.
   * @returns {PersonnelObj[]}
   */
  function generateStartingCrew() {
    // Use placeholder state for name uniqueness (no state yet at generation time)
    const tempUsed = new Set();
    const makeUnique = (archetype) => {
      let attempts = 0;
      let name;
      do {
        name = Names.generate(archetype);
        attempts++;
      } while (tempUsed.has(name) && attempts < 30);
      tempUsed.add(name);
      return name;
    };

    const crew = [
      {
        id: 'p_start_combat',
        name: makeUnique('combat'),
        archetype: 'combat',
        health: ARCHETYPES.combat.maxHealth,
        maxHealth: ARCHETYPES.combat.maxHealth,
        stats: _jitterStats(ARCHETYPES.combat),
        training: null, healing: null, item: null, alive: true, offWorld: false,
      },
      {
        id: 'p_start_science',
        name: makeUnique('science'),
        archetype: 'science',
        health: ARCHETYPES.science.maxHealth,
        maxHealth: ARCHETYPES.science.maxHealth,
        stats: _jitterStats(ARCHETYPES.science),
        training: null, healing: null, item: null, alive: true, offWorld: false,
      },
      {
        id: 'p_start_balanced',
        name: makeUnique('balanced'),
        archetype: 'balanced',
        health: ARCHETYPES.balanced.maxHealth,
        maxHealth: ARCHETYPES.balanced.maxHealth,
        stats: _jitterStats(ARCHETYPES.balanced),
        training: null, healing: null, item: null, alive: true, offWorld: false,
      },
    ];

    return crew;
  }

  function _jitterStats(arch) {
    const stats = {};
    for (const [key, base] of Object.entries(arch.baseStats)) {
      const j = arch.statJitter;
      const jitter = Math.floor(Math.random() * (j * 2 + 1)) - j;
      stats[key] = Math.max(1, Math.min(CONFIG.MAX_STAT_LEVEL - 1, base + jitter));
    }
    return stats;
  }

  // ── Effective stats (base + item bonus) ───────────────────────────────────

  /**
   * Return a personnel's effective stats, including equipped item bonuses.
   * @param {PersonnelObj} p
   * @param {GameState} s
   * @returns {{ combat, diplomacy, science, survival }}
   */
  function effectiveStats(p, s) {
    const base   = { ...p.stats };
    const item   = p.item ? s.items.find(i => i.id === p.item) : null;
    const itemDef = item ? ITEM_DEFS[item.type] : null;

    if (itemDef?.statBonus) {
      for (const [stat, bonus] of Object.entries(itemDef.statBonus)) {
        base[stat] = Math.min(CONFIG.MAX_STAT_LEVEL + 3, (base[stat] ?? 0) + bonus);
        // Allow items to exceed stat cap slightly (max +3 over cap = 13)
      }
    }

    return base;
  }

  // ── Hunger damage ─────────────────────────────────────────────────────────

  /**
   * Apply hunger damage to a personnel.
   * Survival stat reduces damage: high survival = less damage.
   * Formula: dmg = shortage × (1 − survival/MAX × 0.5) × 5, min 1.
   *
   * @param {PersonnelObj} p
   * @param {number} shortage - units of food short (> 0)
   * @returns {{ dmg: number, died: boolean }}
   */
  function applyHungerDamage(p, shortage) {
    if (!p.alive) return { dmg: 0, died: false };
    const survivalFactor = 1 - (p.stats.survival / CONFIG.MAX_STAT_LEVEL) * 0.5;
    const dmg = Math.max(1, Math.round(shortage * survivalFactor * 5));
    p.health = Math.max(0, p.health - dmg);
    const died = p.health === 0;
    if (died) p.alive = false;
    return { dmg, died };
  }

  // ── Training ──────────────────────────────────────────────────────────────

  /**
   * Assign a personnel to train a stat.
   * @param {GameState} s
   * @param {string} personnelId
   * @param {string} statKey
   * @returns {{ ok: boolean, reason?: string }}
   */
  function startTraining(s, personnelId, statKey) {
    const p = _findPersonnel(s, personnelId);
    if (!p)              return { ok: false, reason: 'Personnel not found.' };
    if (!p.alive)        return { ok: false, reason: `${p.name} is not alive.` };
    if (p.offWorld)      return { ok: false, reason: `${p.name} is currently off-world.` };
    if (p.training)      return { ok: false, reason: `${p.name} is already training ${p.training.stat}.` };
    if (p.healing)       return { ok: false, reason: `${p.name} is in the Med Bay.` };

    if (!STATS.find(st => st.key === statKey))
      return { ok: false, reason: `Unknown stat: ${statKey}.` };

    if (p.stats[statKey] >= CONFIG.MAX_STAT_LEVEL)
      return { ok: false, reason: `${p.name}'s ${statKey} is already at maximum (${CONFIG.MAX_STAT_LEVEL}).` };

    if (!_hasRoom(s, 'training_hall'))
      return { ok: false, reason: 'Training Hall required. Build one first.' };

    p.training = {
      stat:           statKey,
      hoursRemaining: s.ui.devMode ? 1 : CONFIG.TRAINING_HOURS_PER_LEVEL,
      startedDay:     s.day,
      startedHour:    s.hour,
    };

    return { ok: true };
  }

  /**
   * Cancel a personnel's training.
   * @param {GameState} s
   * @param {string} personnelId
   * @returns {{ ok: boolean, reason?: string }}
   */
  function cancelTraining(s, personnelId) {
    const p = _findPersonnel(s, personnelId);
    if (!p || !p.training) return { ok: false, reason: 'Not currently training.' };
    const stat = p.training.stat;
    p.training = null;
    return { ok: true, stat };
  }

  /**
   * Process one tick of training for all personnel.
   * Logs and increments stats on completion.
   * @param {GameState} s
   * @param {Function} logFn - (type, msg) => void
   */
  function tickTraining(s, logFn) {
    s.personnel.forEach(p => {
      if (!p.training || !p.alive || p.offWorld) return;
      p.training.hoursRemaining = Math.max(0, p.training.hoursRemaining - 1);
      if (p.training.hoursRemaining === 0) {
        const stat = p.training.stat;
        if (p.stats[stat] < CONFIG.MAX_STAT_LEVEL) {
          p.stats[stat]++;
          logFn('benefit', `${p.name}'s ${STATS.find(st=>st.key===stat)?.label ?? stat} improved to ${p.stats[stat]}.`);
        } else {
          logFn('info', `${p.name}'s ${stat} is already maxed.`);
        }
        p.training = null;
      }
    });
  }

  // ── Med Bay Healing ────────────────────────────────────────────────────────

  /**
   * Healing rates per tick.
   * Without med bay: no passive recovery.
   * With med bay (and medicine): HP_PER_TICK per game-hour.
   */
  const HEAL_HP_PER_TICK        = 3;   // HP restored per tick while in med bay
  const HEAL_MEDICINE_PER_CYCLE = 1;   // medicine consumed per 8 ticks (every ~8 hours)

  /**
   * Assign a personnel to the Med Bay for treatment.
   * @param {GameState} s
   * @param {string} personnelId
   * @returns {{ ok: boolean, reason?: string }}
   */
  function startHealing(s, personnelId) {
    const p = _findPersonnel(s, personnelId);
    if (!p)           return { ok: false, reason: 'Personnel not found.' };
    if (!p.alive)     return { ok: false, reason: `${p.name} is not alive.` };
    if (p.offWorld)   return { ok: false, reason: `${p.name} is off-world.` };
    if (p.healing)    return { ok: false, reason: `${p.name} is already in the Med Bay.` };
    if (p.health >= p.maxHealth)
      return { ok: false, reason: `${p.name} is already at full health.` };

    if (!_hasRoom(s, 'med_bay'))
      return { ok: false, reason: 'Med Bay required. Build one first.' };

    if (s.resources.medicine < 1)
      return { ok: false, reason: 'No medicine available. Gather some off-world.' };

    p.healing = {
      ticksSinceLastCost: 0,
    };
    p.training = null; // can't train while healing

    return { ok: true };
  }

  /**
   * Remove a personnel from the Med Bay.
   */
  function stopHealing(s, personnelId) {
    const p = _findPersonnel(s, personnelId);
    if (!p) return { ok: false };
    p.healing = null;
    return { ok: true };
  }

  /**
   * Process one tick of med bay healing for all personnel.
   * @param {GameState} s
   * @param {Function} logFn
   */
  function tickHealing(s, logFn) {
    if (!_hasRoom(s, 'med_bay')) return;

    s.personnel.forEach(p => {
      if (!p.healing || !p.alive || p.offWorld) return;
      if (p.health >= p.maxHealth) {
        p.healing = null;
        logFn('benefit', `${p.name} has fully recovered.`);
        return;
      }

      // Consume medicine every HEAL_MEDICINE_PER_CYCLE ticks
      p.healing.ticksSinceLastCost = (p.healing.ticksSinceLastCost ?? 0) + 1;
      if (p.healing.ticksSinceLastCost >= 8) {
        p.healing.ticksSinceLastCost = 0;
        if (s.resources.medicine >= HEAL_MEDICINE_PER_CYCLE) {
          s.resources.medicine -= HEAL_MEDICINE_PER_CYCLE;
        } else {
          // No medicine — stop treatment
          p.healing = null;
          logFn('danger', `${p.name}'s treatment halted — no medicine remaining.`);
          return;
        }
      }

      // Apply healing
      p.health = Math.min(p.maxHealth, p.health + HEAL_HP_PER_TICK);
    });
  }

  // ── Item management ────────────────────────────────────────────────────────

  /**
   * Equip an item from the armoury to a personnel.
   * @param {GameState} s
   * @param {string} personnelId
   * @param {string} itemId
   * @returns {{ ok: boolean, reason?: string }}
   */
  function equipItem(s, personnelId, itemId) {
    const p = _findPersonnel(s, personnelId);
    if (!p || !p.alive) return { ok: false, reason: 'Invalid personnel.' };
    if (p.offWorld)     return { ok: false, reason: `${p.name} is off-world.` };

    const item = s.items.find(i => i.id === itemId);
    if (!item)          return { ok: false, reason: 'Item not found.' };
    if (item.assignedTo && item.assignedTo !== personnelId)
      return { ok: false, reason: 'Item is assigned to another personnel.' };

    if (!_hasRoom(s, 'armory') && !s.ui.devMode)
      return { ok: false, reason: 'Armory required to assign items.' };

    // Unequip previous item if any
    if (p.item) {
      const prev = s.items.find(i => i.id === p.item);
      if (prev) prev.assignedTo = null;
    }

    // Equip new item
    p.item       = itemId;
    item.assignedTo = personnelId;

    return { ok: true };
  }

  /**
   * Unequip an item from a personnel.
   */
  function unequipItem(s, personnelId) {
    const p = _findPersonnel(s, personnelId);
    if (!p || !p.item) return { ok: false, reason: 'No item equipped.' };

    const item = s.items.find(i => i.id === p.item);
    if (item) item.assignedTo = null;
    p.item = null;

    return { ok: true };
  }

  // ── Assignment validation ─────────────────────────────────────────────────

  /**
   * Check whether a personnel can be assigned to a gate team.
   * @param {GameState} s
   * @param {string} personnelId
   * @returns {{ ok: boolean, reason?: string }}
   */
  function canAssignToTeam(s, personnelId) {
    const p = _findPersonnel(s, personnelId);
    if (!p)         return { ok: false, reason: 'Personnel not found.' };
    if (!p.alive)   return { ok: false, reason: `${p.name} is deceased.` };
    if (p.offWorld) return { ok: false, reason: `${p.name} is already off-world.` };
    if (p.healing)  return { ok: false, reason: `${p.name} is in the Med Bay.` };
    if (p.health < 20)
      return { ok: false, reason: `${p.name} is critically injured (${p.health} HP). Treat first.` };
    return { ok: true };
  }

  /**
   * Validate a full proposed team (array of personnel IDs).
   * @param {GameState} s
   * @param {string[]} teamIds
   * @returns {{ ok: boolean, errors: string[] }}
   */
  function validateTeam(s, teamIds) {
    const errors = [];

    if (teamIds.length === 0)
      errors.push('Team must have at least 1 member.');
    if (teamIds.length > CONFIG.MAX_TEAM_SIZE)
      errors.push(`Maximum team size is ${CONFIG.MAX_TEAM_SIZE}.`);

    const unique = new Set(teamIds);
    if (unique.size < teamIds.length)
      errors.push('Duplicate personnel in team selection.');

    teamIds.forEach(id => {
      const result = canAssignToTeam(s, id);
      if (!result.ok) errors.push(result.reason);
    });

    return { ok: errors.length === 0, errors };
  }

  /**
   * Mark team members as off-world. Called when gate transit begins.
   */
  function deployTeam(s, teamIds) {
    const validation = validateTeam(s, teamIds);
    if (!validation.ok) return validation;
    teamIds.forEach(id => {
      const p = _findPersonnel(s, id);
      if (p) p.offWorld = true;
    });
    return { ok: true, errors: [] };
  }

  /**
   * Return a team from off-world. Called on gate return.
   */
  function recallTeam(s, teamIds) {
    teamIds.forEach(id => {
      const p = _findPersonnel(s, id);
      if (p) p.offWorld = false;
    });
  }

  // ── Screen renderer ───────────────────────────────────────────────────────

  /**
   * Render the full personnel scene into #personnel-scene.
   * Replaces the basic list from ui.js with the full Phase 3 UI.
   * @param {GameState} s
   * @param {string|null} selectedId — currently expanded card id
   */
  function renderScreen(s, selectedId = null) {
    const container = document.getElementById('personnel-scene');
    if (!container) return;

    const alive  = s.personnel.filter(p => p.alive);
    const dead   = s.personnel.filter(p => !p.alive);
    const hasTH  = _hasRoom(s, 'training_hall');
    const hasMB  = _hasRoom(s, 'med_bay');
    const hasArm = _hasRoom(s, 'armory');

    // Summary bar
    const summaryHtml = `
      <div class="pers-summary">
        <div class="pers-summary-stat">
          <span class="pers-summary-num ${alive.length === 0 ? 'red' : ''}">${alive.length}</span>
          <span class="pers-summary-label">Active</span>
        </div>
        <div class="pers-summary-divider"></div>
        <div class="pers-summary-stat">
          <span class="pers-summary-num">${s.personnel.filter(p => p.alive && p.offWorld).length}</span>
          <span class="pers-summary-label">Off-world</span>
        </div>
        <div class="pers-summary-divider"></div>
        <div class="pers-summary-stat">
          <span class="pers-summary-num ${dead.length > 0 ? 'red' : 'dim'}">${dead.length}</span>
          <span class="pers-summary-label">Lost</span>
        </div>
        <div class="pers-summary-divider"></div>
        <div class="pers-summary-stat">
          <span class="pers-summary-num ${s.resources.medicine === 0 ? 'red' : 'olive'}">${s.resources.medicine}</span>
          <span class="pers-summary-label">Medicine</span>
        </div>
        <div style="flex:1"></div>
        ${!hasTH  ? '<span class="facility-missing" title="Build Training Hall">No Training Hall</span>' : ''}
        ${!hasMB  ? '<span class="facility-missing" title="Build Med Bay">No Med Bay</span>'          : ''}
      </div>`;

    // Personnel cards
    const cardsHtml = s.personnel.map(p => _renderCard(p, s, selectedId, hasTH, hasMB, hasArm)).join('');

    container.innerHTML = summaryHtml + `<div class="pers-card-list">${cardsHtml}</div>`;
  }

  /**
   * Render a single personnel card with expandable detail section.
   */
  function _renderCard(p, s, selectedId, hasTH, hasMB, hasArm) {
    const isSelected  = p.id === selectedId;
    const arch        = ARCHETYPES[p.archetype] ?? ARCHETYPES.balanced;
    const effStats    = effectiveStats(p, s);
    const item        = p.item ? s.items.find(i => i.id === p.item) : null;
    const itemDef     = item ? ITEM_DEFS[item.type] : null;
    const healthPct   = Math.round((p.health / p.maxHealth) * 100);
    const healthClass = healthPct > 60 ? 'health-good' : healthPct > 30 ? 'health-warn' : 'health-crit';

    // Status badge
    let statusBadge = '';
    if (!p.alive)     statusBadge = '<span class="pers-badge badge-dead">KIA</span>';
    else if (p.offWorld) statusBadge = '<span class="pers-badge badge-offworld">Off-world</span>';
    else if (p.healing)  statusBadge = '<span class="pers-badge badge-healing">Med Bay</span>';
    else if (p.training) statusBadge = '<span class="pers-badge badge-training">Training</span>';

    // Compact stat row
    const statRowHtml = STATS.map(st => {
      const base  = p.stats[st.key];
      const eff   = effStats[st.key];
      const bonus = eff - base;
      const pips  = _renderPips(eff, base);
      return `
        <div class="pers-stat-col" title="${st.description}">
          <div class="stat-glyph">${st.glyph}</div>
          <div class="stat-pips">${pips}</div>
          <div class="stat-val">${base}${bonus > 0 ? `<span class="stat-bonus">+${bonus}</span>` : ''}</div>
        </div>`;
    }).join('');

    // Training progress
    let trainingHtml = '';
    if (p.training) {
      const total   = CONFIG.TRAINING_HOURS_PER_LEVEL;
      const done    = total - p.training.hoursRemaining;
      const pct     = Math.round((done / total) * 100);
      const statDef = STATS.find(st => st.key === p.training.stat);
      trainingHtml = `
        <div class="pers-progress-row">
          <span class="dim">${statDef?.glyph ?? ''} Training ${statDef?.label ?? p.training.stat}</span>
          <div class="pers-prog-bar-wrap">
            <div class="pers-prog-bar" style="width:${pct}%"></div>
          </div>
          <span class="dim">${p.training.hoursRemaining}h</span>
        </div>`;
    }

    // Healing progress
    let healingHtml = '';
    if (p.healing && p.alive) {
      healingHtml = `
        <div class="pers-progress-row">
          <span class="olive">⛑ Med Bay treatment</span>
          <div class="pers-prog-bar-wrap">
            <div class="pers-prog-bar heal-bar" style="width:${healthPct}%"></div>
          </div>
          <span class="dim">${p.health}/${p.maxHealth} HP</span>
        </div>`;
    }

    // Expanded detail panel
    let detailHtml = '';
    if (isSelected && p.alive) {
      detailHtml = _renderCardDetail(p, s, hasTH, hasMB, hasArm, effStats, item, itemDef);
    }

    return `
      <div class="pers-card ${!p.alive ? 'pers-dead' : ''} ${isSelected ? 'pers-expanded' : ''}"
           data-id="${p.id}">
        <!-- Header row -->
        <div class="pers-card-header" onclick="Personnel.toggleCard('${p.id}')">
          <div class="pers-archetype-glyph">${arch.callout}</div>
          <div class="pers-card-main">
            <div class="pers-name-row">
              <span class="pers-name">${p.name}</span>
              ${statusBadge}
            </div>
            <div class="pers-archetype-label dim">${arch.label}</div>
          </div>
          <div class="pers-health-col">
            <div class="pers-hp-bar">
              <div class="pers-hp-fill ${healthClass}" style="width:${healthPct}%"></div>
            </div>
            <div class="pers-hp-text ${healthClass}">${p.health}<span class="dim">/${p.maxHealth}</span></div>
          </div>
          <div class="pers-expand-arrow">${isSelected ? '▲' : '▼'}</div>
        </div>

        <!-- Stat row (always visible) -->
        <div class="pers-stat-row">${statRowHtml}</div>

        <!-- Progress bars (training / healing) -->
        ${trainingHtml}
        ${healingHtml}

        <!-- Item strip -->
        ${item ? `
          <div class="pers-item-strip">
            <span class="item-glyph">${itemDef?.glyph ?? '?'}</span>
            <span class="item-name dim">${itemDef?.label ?? item.type}</span>
            ${Object.entries(itemDef?.statBonus ?? {}).map(([k,v]) => `<span class="item-bonus">+${v} ${k}</span>`).join('')}
          </div>` : ''}

        <!-- Expanded detail -->
        ${detailHtml}
      </div>`;
  }

  /**
   * Render the expanded card detail section (actions, full stat breakdown, item management).
   */
  function _renderCardDetail(p, s, hasTH, hasMB, hasArm, effStats, item, itemDef) {
    // Training action buttons
    const trainingBtns = STATS.map(st => {
      const atMax    = p.stats[st.key] >= CONFIG.MAX_STAT_LEVEL;
      const training = p.training?.stat === st.key;
      const disabled = !hasTH || p.training || p.healing || p.offWorld || atMax;
      return `
        <button class="btn btn-ghost pers-action-btn ${training ? 'btn-active-train' : ''}"
                ${disabled ? 'disabled' : ''}
                onclick="Personnel.handleTrainClick('${p.id}','${st.key}')"
                title="${atMax ? 'Already maxed' : !hasTH ? 'No Training Hall' : `Train ${st.label} (24h)`}">
          ${st.glyph} ${st.label}
          <span class="stat-badge">${p.stats[st.key]}/${CONFIG.MAX_STAT_LEVEL}</span>
          ${training ? '<span class="training-spinner">↻</span>' : ''}
        </button>`;
    }).join('');

    // Heal action
    const canHeal    = hasMB && !p.healing && !p.training && !p.offWorld
                       && p.health < p.maxHealth && s.resources.medicine > 0;
    const healReason = !hasMB          ? 'No Med Bay'
                     : p.healing        ? 'Already in Med Bay'
                     : p.offWorld       ? 'Off-world'
                     : s.resources.medicine < 1 ? 'No medicine'
                     : p.health >= p.maxHealth   ? 'Full health'
                     : '';
    const healBtn = `
      <button class="btn btn-olive pers-action-btn ${p.healing ? 'btn-healing' : ''}"
              ${canHeal || p.healing ? '' : 'disabled'}
              onclick="Personnel.handleHealClick('${p.id}')"
              title="${healReason || 'Assign to Med Bay'}">
        ⛑ ${p.healing ? 'Stop Treatment' : 'Med Bay'}
        ${!canHeal && !p.healing ? `<span class="dim"> — ${healReason}</span>` : ''}
      </button>`;

    // Item management
    const unequippedItems = s.items.filter(i => !i.assignedTo || i.assignedTo === p.id);
    const itemSelectHtml  = hasArm || s.ui.devMode ? `
      <div class="pers-item-select">
        <div class="pers-detail-label">Equipment</div>
        <div class="item-slot-row">
          ${item ? `
            <div class="equipped-item">
              <span>${itemDef?.glyph} ${itemDef?.label}</span>
              <button class="btn btn-red" style="padding:2px 8px;font-size:13px"
                      onclick="Personnel.handleUnequipClick('${p.id}')">Unequip</button>
            </div>` : '<span class="dim" style="font-size:15px">No item equipped</span>'}
        </div>
        ${unequippedItems.filter(i => i.id !== p.item).length > 0 ? `
          <select class="item-select-dropdown" onchange="Personnel.handleEquipSelect('${p.id}', this.value)">
            <option value="">— Equip item —</option>
            ${unequippedItems.filter(i => !i.assignedTo).map(i => {
              const def = ITEM_DEFS[i.type];
              const bonusStr = Object.entries(def?.statBonus ?? {}).map(([k,v]) => `+${v} ${k}`).join(' ');
              return `<option value="${i.id}">${def?.glyph ?? ''} ${def?.label ?? i.type} ${bonusStr}</option>`;
            }).join('')}
          </select>` : ''}
      </div>` : `<div class="pers-detail-label dim">Build Armory to manage equipment</div>`;

    // Full stat breakdown
    const statBreakdown = STATS.map(st => {
      const base  = p.stats[st.key];
      const bonus = effStats[st.key] - base;
      return `
        <div class="pers-stat-breakdown-row">
          <span>${st.glyph} ${st.label}</span>
          <span class="dim">${base}${bonus > 0 ? ` <span class="olive">+${bonus}</span>` : ''} / ${CONFIG.MAX_STAT_LEVEL}</span>
        </div>`;
    }).join('');

    return `
      <div class="pers-detail-panel">
        <div class="pers-detail-col">
          <div class="pers-detail-label">Train Stat</div>
          <div class="pers-train-grid">${trainingBtns}</div>
          <div style="margin-top:var(--sp-2)">${healBtn}</div>
        </div>
        <div class="pers-detail-col">
          <div class="pers-detail-label">Stats</div>
          <div class="pers-stat-breakdown">${statBreakdown}</div>
          ${itemSelectHtml}
        </div>
      </div>`;
  }

  /**
   * Render pip bar: filled pips up to effective stat, hollow above, shaded if bonus.
   */
  function _renderPips(effective, base) {
    const MAX  = CONFIG.MAX_STAT_LEVEL;
    let html   = '';
    for (let i = 1; i <= MAX; i++) {
      if (i <= base)      html += '<span class="pip pip-filled"></span>';
      else if (i <= effective) html += '<span class="pip pip-bonus"></span>';
      else                html += '<span class="pip pip-empty"></span>';
    }
    return html;
  }

  // ── Card toggle (click to expand) ─────────────────────────────────────────

  let _selectedCardId = null;

  function toggleCard(id) {
    _selectedCardId = _selectedCardId === id ? null : id;
    if (State.isReady()) renderScreen(State.get(), _selectedCardId);
  }

  // ── Action handlers (called from inline onclick) ──────────────────────────

  function handleTrainClick(personnelId, stat) {
    if (!State.isReady()) return;
    const s = State.get();
    const p = _findPersonnel(s, personnelId);
    if (!p) return;

    if (p.training?.stat === stat) {
      // Cancel training
      const result = cancelTraining(s, personnelId);
      if (result.ok) {
        Engine.log('info', `${p.name} stopped training ${result.stat}.`);
        UI.showNotification(`Training cancelled.`, 'info');
      }
    } else {
      const result = startTraining(s, personnelId, stat);
      if (result.ok) {
        const statDef = STATS.find(st => st.key === stat);
        Engine.log('benefit', `${p.name} started training ${statDef?.label ?? stat}.`);
        UI.showNotification(`Training started: ${statDef?.label ?? stat}`, 'success');
      } else {
        UI.showNotification(result.reason, 'warn');
      }
    }
    renderScreen(s, _selectedCardId);
  }

  function handleHealClick(personnelId) {
    if (!State.isReady()) return;
    const s = State.get();
    const p = _findPersonnel(s, personnelId);
    if (!p) return;

    if (p.healing) {
      stopHealing(s, personnelId);
      Engine.log('info', `${p.name} discharged from Med Bay.`);
      UI.showNotification(`${p.name} discharged.`, 'info');
    } else {
      const result = startHealing(s, personnelId);
      if (result.ok) {
        Engine.log('benefit', `${p.name} admitted to Med Bay.`);
        UI.showNotification(`Treatment started.`, 'success');
      } else {
        UI.showNotification(result.reason, 'warn');
      }
    }
    renderScreen(s, _selectedCardId);
  }

  function handleEquipSelect(personnelId, itemId) {
    if (!itemId || !State.isReady()) return;
    const s = State.get();
    const p = _findPersonnel(s, personnelId);
    if (!p) return;

    const result = equipItem(s, personnelId, itemId);
    const itemDef = ITEM_DEFS[s.items.find(i => i.id === itemId)?.type];
    if (result.ok) {
      Engine.log('benefit', `${p.name} equipped ${itemDef?.label ?? itemId}.`);
      UI.showNotification(`${itemDef?.label ?? 'Item'} equipped.`, 'success');
    } else {
      UI.showNotification(result.reason, 'warn');
    }
    renderScreen(s, _selectedCardId);
  }

  function handleUnequipClick(personnelId) {
    if (!State.isReady()) return;
    const s = State.get();
    const p = _findPersonnel(s, personnelId);
    if (!p) return;

    const result = unequipItem(s, personnelId);
    if (result.ok) {
      UI.showNotification('Item unequipped.', 'info');
      Engine.log('info', `${p.name} unequipped their item.`);
    }
    renderScreen(s, _selectedCardId);
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  function _findPersonnel(s, id) {
    return s.personnel.find(p => p.id === id) ?? null;
  }

  function _hasRoom(s, type) {
    return s.rooms.some(r => r.type === type && !r.constructing);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    ARCHETYPES,
    STATS,
    ITEM_DEFS,

    // Generation
    generate,
    generateStartingCrew,

    // Stat computation
    effectiveStats,

    // Hunger
    applyHungerDamage,

    // Training
    startTraining,
    cancelTraining,
    tickTraining,

    // Healing
    startHealing,
    stopHealing,
    tickHealing,
    HEAL_HP_PER_TICK,

    // Items
    equipItem,
    unequipItem,

    // Assignment
    canAssignToTeam,
    validateTeam,
    deployTeam,
    recallTeam,

    // Rendering
    renderScreen,

    // Interaction handlers
    toggleCard,
    handleTrainClick,
    handleHealClick,
    handleEquipSelect,
    handleUnequipClick,
  };

})();
