/**
 * STARGATE: REMNANTS — Research Definitions
 * 28 research nodes across 4 tiers.
 *
 * Each node:
 *   id           string   — unique key, stored in s.research.researched[]
 *   label        string   — display name
 *   tier         1–4      — unlocked sequentially; tier N requires ≥1 completed from tier N-1
 *   category     string   — 'defence' | 'base' | 'gate' | 'science' | 'medical' | 'intel'
 *   glyph        string   — display icon
 *   cost         object   — resource cost to start
 *   hours        number   — in-game hours to complete (requires research_lab room)
 *   requires     string[] — prerequisite research IDs (all must be done)
 *   requiresRoom string[] — base room types required to start this research
 *   effect       string   — human-readable effect description
 *   effects      object   — machine-readable effects (read by engine/modules)
 *     { statBonus, resourceMult, missionBonus, unlockItem, unlockRoom, passiveBonus }
 */

const RESEARCH_DEFS = Object.freeze({

  // ══════════════════════════════════════════════════════════════
  // TIER 1 — Foundations  (no prerequisites)
  // ══════════════════════════════════════════════════════════════

  field_medicine: {
    id:           'field_medicine',
    label:        'Field Medicine',
    tier:         1,
    category:     'medical',
    glyph:        '⛑',
    cost:         { medicine: 5, data: 3 },
    hours:        12,
    requires:     [],
    requiresRoom: ['research_lab'],
    effect:       'Personnel recover 25% more HP per hour in the Med Bay. Survival stat grants +1 bonus to all team missions.',
    effects: {
      medBayHealBonus:    0.25,   // multiplier on hourly HP recovery
      missionBonus:       { stat: 'survival', bonus: 1 },
    },
  },

  basic_metallurgy: {
    id:           'basic_metallurgy',
    label:        'Basic Metallurgy',
    tier:         1,
    category:     'base',
    glyph:        '⚙',
    cost:         { alloys: 8, naquadah: 5 },
    hours:        10,
    requires:     [],
    requiresRoom: ['research_lab'],
    effect:       'Unlocks the Kevlar Vest and Tactical Armour in the Workshop. Construction build time reduced by 20%.',
    effects: {
      buildTimeReduction: 0.20,
      unlockItems:        ['kevlar_vest', 'tactical_armour'],
    },
  },

  gate_diagnostics: {
    id:           'gate_diagnostics',
    label:        'Gate Diagnostics',
    tier:         1,
    category:     'gate',
    glyph:        '◎',
    cost:         { data: 6, crystals: 2 },
    hours:        8,
    requires:     [],
    requiresRoom: ['research_lab'],
    effect:       'Increases gate address decoding speed. Mission intel has a 25% higher chance of revealing an additional symbol when scouting.',
    effects: {
      decodingIntelBonus: 0.25,  // extra reveal chance on mission intel
    },
  },

  hydroponics_boost: {
    id:           'hydroponics_boost',
    label:        'Hydroponics Boost',
    tier:         1,
    category:     'base',
    glyph:        '🌿',
    cost:         { rarePlants: 4, data: 2 },
    hours:        8,
    requires:     [],
    requiresRoom: ['hydroponics'],
    effect:       'Hydroponics bay produces +1 extra food per tick. Rare plant yield from missions increased by 1.',
    effects: {
      hydroponicsBonus:   1,      // extra food per tick
      rarePlantMissionBonus: 1,
    },
  },

  combat_training: {
    id:           'combat_training',
    label:        'Combat Training Protocol',
    tier:         1,
    category:     'defence',
    glyph:        '⚔',
    cost:         { naquadah: 8, alloys: 4 },
    hours:        12,
    requires:     [],
    requiresRoom: ['training_hall'],
    effect:       'Training hall teaches combat 15% faster. Unlocks Zat\'nik\'tel in Workshop. Personnel with combat ≥4 deal reduced incoming damage.',
    effects: {
      trainingSpeedBonus: { stat: 'combat', multiplier: 0.15 },
      unlockItems:        ['zat_gun'],
      combatDamageReduction: 0.15,
    },
  },

  // ══════════════════════════════════════════════════════════════
  // TIER 2 — Expansion  (requires ≥1 Tier 1)
  // ══════════════════════════════════════════════════════════════

  advanced_alloys: {
    id:           'advanced_alloys',
    label:        'Advanced Alloys',
    tier:         2,
    category:     'base',
    glyph:        '⛨',
    cost:         { alloys: 15, naquadah: 10, crystals: 5 },
    hours:        18,
    requires:     ['basic_metallurgy'],
    requiresRoom: ['research_lab', 'workshop'],
    effect:       'Unlocks Plasma Cannon crafting. Alloy storage cap increased by 30. Workshop crafts items 20% faster.',
    effects: {
      storageBonus:       { resource: 'alloys', amount: 30 },
      craftSpeedBonus:    0.20,
      unlockItems:        ['plasma_cannon'],
    },
  },

  ancient_db_search: {
    id:           'ancient_db_search',
    label:        'Ancient DB Keyword Search',
    tier:         2,
    category:     'intel',
    glyph:        '⌬',
    cost:         { ancientTech: 3, data: 10 },
    hours:        16,
    requires:     ['gate_diagnostics'],
    requiresRoom: ['research_lab'],
    effect:       'Activates the Ancient Database keyword search system in the Intel tab. Query partial gate addresses by keyword.',
    effects: {
      unlockFeature: 'ancient_db_search',
    },
  },

  naquadah_processing: {
    id:           'naquadah_processing',
    label:        'Naquadah Processing',
    tier:         2,
    category:     'base',
    glyph:        '⎊',
    cost:         { naquadah: 20, advancedTech: 3 },
    hours:        20,
    requires:     ['basic_metallurgy'],
    requiresRoom: ['research_lab'],
    effect:       'Naquadah collected from missions yields +2 additional per haul. Power Core generates +1 bonus power per day.',
    effects: {
      missionResourceBonus: { resource: 'naquadah', bonus: 2 },
      powerCoreBonus:       1,
    },
  },

  xenobiology: {
    id:           'xenobiology',
    label:        'Xenobiology',
    tier:         2,
    category:     'medical',
    glyph:        '🔬',
    cost:         { rarePlants: 8, medicine: 8, data: 5 },
    hours:        14,
    requires:     ['field_medicine'],
    requiresRoom: ['research_lab', 'med_bay'],
    effect:       'Unlocks Medical Kit crafting. Rare plant samples grant bonus medicine when processed. Science stat grants healing bonus in Med Bay.',
    effects: {
      unlockItems:          ['medkit'],
      rarePlantMedBonus:    1,
      scienceHealBonus:     true,
    },
  },

  diplomatic_protocols: {
    id:           'diplomatic_protocols',
    label:        'Diplomatic Protocols',
    tier:         2,
    category:     'gate',
    glyph:        '🤝',
    cost:         { data: 12, artifacts: 5 },
    hours:        12,
    requires:     ['gate_diagnostics'],
    requiresRoom: ['research_lab'],
    effect:       'Unlocks Universal Translator crafting. Diplomatic missions have +15% base success chance. Traveller hints reveal one extra symbol.',
    effects: {
      unlockItems:          ['universal_translator'],
      missionBonus:         { mission: 'diplomacy', bonus: 0.15 },
      travellerRevealBonus: 1,
    },
  },

  perimeter_sensors: {
    id:           'perimeter_sensors',
    label:        'Perimeter Sensors',
    tier:         2,
    category:     'defence',
    glyph:        '📡',
    cost:         { crystals: 10, advancedTech: 4, naquadah: 8 },
    hours:        16,
    requires:     ['combat_training'],
    requiresRoom: ['research_lab'],
    effect:       'Unlocks Long-Range Scanner crafting. Base defences now detect incoming threats one hour earlier. Danger random events reduced by 20%.',
    effects: {
      unlockItems:      ['long_range_scanner'],
      dangerEventReduc: 0.20,
      earlyWarning:     true,
    },
  },

  // ══════════════════════════════════════════════════════════════
  // TIER 3 — Mastery  (requires ≥2 Tier 2)
  // ══════════════════════════════════════════════════════════════

  naquadah_enhanced_weapons: {
    id:           'naquadah_enhanced_weapons',
    label:        'Naquadah-Enhanced Weapons',
    tier:         3,
    category:     'defence',
    glyph:        '⚡',
    cost:         { naquadah: 25, advancedTech: 8, alloys: 10 },
    hours:        24,
    requires:     ['advanced_alloys', 'naquadah_processing'],
    requiresRoom: ['research_lab', 'workshop', 'armory'],
    effect:       'All crafted weapons deal +1 effective combat stat. Sabotage and mining missions gain +10% success. Unlocks Combat Stims.',
    effects: {
      weaponStatBonus:   1,
      unlockItems:       ['stims'],
      missionBonus:      { missions: ['sabotage', 'mining'], bonus: 0.10 },
    },
  },

  ancient_tech_study: {
    id:           'ancient_tech_study',
    label:        'Ancient Technology Study',
    tier:         3,
    category:     'science',
    glyph:        '∞',
    cost:         { ancientTech: 8, data: 15, artifacts: 8 },
    hours:        30,
    requires:     ['ancient_db_search', 'xenobiology'],
    requiresRoom: ['research_lab'],
    effect:       'Unlocks Ancient Device crafting. Ancient Tech missions yield +50% resources. Data Pad now grants +1 extra science bonus.',
    effects: {
      unlockItems:        ['ancient_device', 'data_pad'],
      ancientTechMult:    1.50,
      dataPadBonus:       1,
    },
  },

  gate_shield_protocols: {
    id:           'gate_shield_protocols',
    label:        'Gate Shield Protocols',
    tier:         3,
    category:     'gate',
    glyph:        '◉',
    cost:         { crystals: 12, ancientTech: 5, data: 10 },
    hours:        20,
    requires:     ['perimeter_sensors', 'gate_diagnostics'],
    requiresRoom: ['research_lab', 'gate_room'],
    effect:       'Iris efficiency improved — damage from uninvited wormhole incursions reduced by 50%. Gate addresses can be saved to quick-dial.',
    effects: {
      irisDefenceBonus: 0.50,
      quickDialUnlock:  true,
    },
  },

  advanced_medicine: {
    id:           'advanced_medicine',
    label:        'Advanced Medicine',
    tier:         3,
    category:     'medical',
    glyph:        '💊',
    cost:         { medicine: 15, ancientTech: 4, rarePlants: 10 },
    hours:        22,
    requires:     ['xenobiology', 'field_medicine'],
    requiresRoom: ['research_lab', 'med_bay'],
    effect:       'Personnel fully heal 30% faster. Critical injuries (below 20 HP) have a 25% chance to auto-stabilise without Med Bay access.',
    effects: {
      healSpeedBonus:    0.30,
      critStabiliseChance: 0.25,
    },
  },

  power_cell_tech: {
    id:           'power_cell_tech',
    label:        'Power Cell Technology',
    tier:         3,
    category:     'base',
    glyph:        '⌬',
    cost:         { crystals: 15, naquadah: 20, ancientTech: 6 },
    hours:        26,
    requires:     ['naquadah_processing', 'ancient_db_search'],
    requiresRoom: ['research_lab', 'power_core'],
    effect:       'Power Core generates +2 additional power per day. Base power grid becomes more efficient — all rooms cost 1 less power (min 0).',
    effects: {
      powerCoreBonus:     2,
      roomPowerReduction: 1,
    },
  },

  counter_intelligence: {
    id:           'counter_intelligence',
    label:        'Counter-Intelligence',
    tier:         3,
    category:     'intel',
    glyph:        '👁',
    cost:         { data: 18, advancedTech: 6 },
    hours:        20,
    requires:     ['perimeter_sensors', 'diplomatic_protocols'],
    requiresRoom: ['research_lab'],
    effect:       'Elimination decoding puzzles provide one free elimination on all puzzles. Intel from artifacts reveals 2 symbols (up from 1).',
    effects: {
      elimFreeRuleout:    1,
      artifactRevealBonus: 1,
    },
  },

  // ══════════════════════════════════════════════════════════════
  // TIER 4 — Endgame  (requires ≥2 Tier 3)
  // ══════════════════════════════════════════════════════════════

  zpm_interface: {
    id:           'zpm_interface',
    label:        'ZPM Interface Protocol',
    tier:         4,
    category:     'gate',
    glyph:        '⌬',
    cost:         { ancientTech: 20, crystals: 20, data: 25 },
    hours:        48,
    requires:     ['gate_shield_protocols', 'power_cell_tech'],
    requiresRoom: ['research_lab', 'gate_room', 'power_core'],
    effect:       'Enables ZPM installation in the gate room. A fully charged ZPM combined with the Pegasus address wins the game.',
    effects: {
      unlockFeature: 'zpm_interface',
      winConditionPart: true,
    },
  },

  replicator_countermeasures: {
    id:           'replicator_countermeasures',
    label:        'Replicator Countermeasures',
    tier:         4,
    category:     'defence',
    glyph:        '⊗',
    cost:         { naniteTech: 5, advancedTech: 15, naquadah: 20 },
    hours:        40,
    requires:     ['naquadah_enhanced_weapons', 'counter_intelligence'],
    requiresRoom: ['research_lab', 'armory'],
    effect:       'Replicator fragments can now be safely studied. Ghost moon (P6M) missions yield +100% tech resources. Team immunity to Replicator events.',
    effects: {
      replicatorImmunity: true,
      ghostMoonBonus:     1.00,
      unlockItems:        ['stims'],   // stims already covered; future expansion
    },
  },

  ancient_ascension_study: {
    id:           'ancient_ascension_study',
    label:        'Ancient Ascension Study',
    tier:         4,
    category:     'science',
    glyph:        '⍾',
    cost:         { ancientTech: 15, artifacts: 15, data: 20 },
    hours:        44,
    requires:     ['ancient_tech_study', 'advanced_medicine'],
    requiresRoom: ['research_lab'],
    effect:       'The deepest understanding of Ancient philosophy. All science-stat personnel gain +1 effective science. Anquietas missions always succeed at \'partial\' or above.',
    effects: {
      scienceStatBonus:    1,
      anquietasFloor:      'partial',
    },
  },

  omega_protocol: {
    id:           'omega_protocol',
    label:        'Omega Protocol',
    tier:         4,
    category:     'defence',
    glyph:        '☠',
    cost:         { naquadah: 30, advancedTech: 20, naniteTech: 8 },
    hours:        48,
    requires:     ['replicator_countermeasures', 'gate_shield_protocols'],
    requiresRoom: ['research_lab', 'armory', 'gate_room'],
    effect:       'Last resort base destruction sequence. Reduces incoming Goa\'uld event damage by 40%. All combat personnel gain +2 effective combat.',
    effects: {
      goauldEventReduction: 0.40,
      combatStatBonus:      2,
    },
  },

  long_range_comms: {
    id:           'long_range_comms',
    label:        'Long-Range Gate Comms',
    tier:         4,
    category:     'intel',
    glyph:        '∞',
    cost:         { ancientTech: 12, crystals: 15, data: 20 },
    hours:        36,
    requires:     ['counter_intelligence', 'ancient_tech_study'],
    requiresRoom: ['research_lab', 'gate_room'],
    effect:       'Unlocks passive decoding — each day, one random unknown world advances one state tier automatically. Doubles data from data_download missions.',
    effects: {
      passiveDecodingPerDay: 1,
      dataMissionBonus:      1.0,
    },
  },

});

/**
 * Get all research defs as an array, sorted by tier then category.
 */
function allResearch() {
  return Object.values(RESEARCH_DEFS).sort((a, b) =>
    a.tier !== b.tier ? a.tier - b.tier : a.category.localeCompare(b.category)
  );
}

/**
 * Get all research defs for a given tier.
 */
function researchByTier(tier) {
  return Object.values(RESEARCH_DEFS).filter(r => r.tier === tier);
}

/**
 * Check whether a research node is unlockable given current state.
 * Returns { available, reason }.
 */
function researchAvailable(id, s) {
  const def = RESEARCH_DEFS[id];
  if (!def) return { available: false, reason: 'Unknown research.' };
  if (s.research.researched.includes(id)) return { available: false, reason: 'Already researched.' };
  if (s.research.inProgress?.id === id) return { available: false, reason: 'In progress.' };

  // Tier gate: at least one research from the previous tier must be done
  if (def.tier > 1) {
    const prevTierDone = Object.values(RESEARCH_DEFS).some(r =>
      r.tier === def.tier - 1 && s.research.researched.includes(r.id)
    );
    if (!prevTierDone) return { available: false, reason: `Requires at least one Tier ${def.tier - 1} research.` };
  }

  // Prerequisites
  for (const req of def.requires) {
    if (!s.research.researched.includes(req)) {
      return { available: false, reason: `Requires: ${RESEARCH_DEFS[req]?.label ?? req}` };
    }
  }

  // Room requirements
  for (const roomType of def.requiresRoom) {
    const hasRoom = s.rooms.some(r => r.type === roomType && !r.constructing);
    if (!hasRoom) {
      const Base = typeof window !== 'undefined' ? window.Base : null;
      const label = roomType.replace(/_/g, ' ');
      return { available: false, reason: `Requires: ${label}` };
    }
  }

  // Note: resource affordability is checked separately in _renderNode.
  // researchAvailable() only gates on prerequisites, rooms, and tier progress.
  return { available: true, reason: '' };
}


/**
 * STARGATE: REMNANTS — Research Module
 * Tech tree UI, research queue management, effect application.
 * Rendered into #research-scene.
 */

const Research = (() => {

  // ── Active filter ────────────────────────────────────────────────────────
  let _filterCat = 'all';   // 'all' | category string
  let _hoveredId = null;    // for tooltip preview

  // ── Screen entry point ────────────────────────────────────────────────────

  function renderScreen(s) {
    const container = document.getElementById('research-scene');
    if (!container) return;

    try {
      _renderScreenInner(s, container);
    } catch (err) {
      console.error('[Research] renderScreen crashed:', err);
      container.innerHTML = `<div class="rs-no-lab"><div class="rs-no-lab-title" style="color:var(--c-red-bright)">Research Error</div><p class="dim">${err.message}</p></div>`;
    }
  }

  function _renderScreenInner(s, container) {
    const hasLab = s.rooms.some(r => r.type === 'research_lab' && !r.constructing);
    if (!hasLab) {
      container.innerHTML = `
        <div class="rs-no-lab">
          <div class="rs-no-lab-icon">🔬</div>
          <div class="rs-no-lab-title">Research Lab Required</div>
          <p class="dim">Build a Research Lab in the Base screen to access the technology tree.</p>
          <button class="btn btn-olive" onclick="UI.navigateTo('home')">← Go to Base</button>
        </div>`;
      return;
    }

    const tiers = [1, 2, 3, 4];
    const categories = ['all', ...new Set(Object.values(RESEARCH_DEFS).map(r => r.category))];

    const inProg = s.research.inProgress;
    const inProgDef = inProg ? RESEARCH_DEFS[inProg.id] : null;

    // Active queue banner
    const queueBanner = inProg && inProgDef ? `
      <div class="rs-queue-banner">
        <div class="rs-qb-left">
          <span class="rs-qb-glyph">${inProgDef.glyph}</span>
          <div>
            <div class="rs-qb-label">Researching: <strong>${inProgDef.label}</strong></div>
            <div class="rs-qb-meta dim">Tier ${inProgDef.tier} · ${inProgDef.category}</div>
          </div>
        </div>
        <div class="rs-qb-right">
          <div class="rs-qb-hours dim">${inProg.hoursRemaining}h remaining</div>
          <div class="rs-qb-bar-wrap">
            <div class="rs-qb-bar">
              <div class="rs-qb-fill" style="width:${Math.round((1 - inProg.hoursRemaining / inProgDef.hours) * 100)}%"></div>
            </div>
          </div>
          <button class="btn btn-ghost rs-qb-cancel" onclick="Research.cancelResearch()">Cancel</button>
        </div>
      </div>` : `
      <div class="rs-queue-banner rs-queue-idle">
        <span class="dim">No research in progress — select a technology to begin.</span>
      </div>`;

    // Category filter tabs
    const filterTabs = categories.map(cat => `
      <button class="rs-filter-btn ${_filterCat === cat ? 'rs-filter-active' : ''}"
              onclick="Research.setFilter('${cat}')">${cat}</button>`).join('');

    // Stats bar
    const doneCount = s.research.researched.length;
    const totalCount = Object.keys(RESEARCH_DEFS).length;

    // Tier rows
    const tierHtml = tiers.map(tier => {
      const nodes = researchByTier(tier).filter(r =>
        _filterCat === 'all' || r.category === _filterCat
      );
      if (!nodes.length) return '';

      const tierLabel = ['', 'Foundations', 'Expansion', 'Mastery', 'Endgame'][tier];
      const tierDone  = nodes.filter(r => s.research.researched.includes(r.id)).length;

      const nodeCards = nodes.map(r => _renderNode(r, s)).join('');

      return `
        <div class="rs-tier-row">
          <div class="rs-tier-label">
            <span class="rs-tier-num">T${tier}</span>
            <span class="rs-tier-name">${tierLabel}</span>
            <span class="rs-tier-count dim">${tierDone}/${nodes.length}</span>
          </div>
          <div class="rs-tier-nodes">${nodeCards}</div>
        </div>`;
    }).join('');

    container.innerHTML = `
      <div class="rs-layout">
        <div class="rs-header">
          <div>
            <div class="rs-title">Research Laboratory</div>
            <div class="dim" style="font-size:14px">${doneCount} / ${totalCount} technologies researched</div>
          </div>
          <div class="rs-filter-bar">${filterTabs}</div>
        </div>
        ${queueBanner}
        <div class="rs-tree">${tierHtml}</div>
      </div>`;
  }

  // ── Node card renderer ────────────────────────────────────────────────────

  function _renderNode(r, s) {
    const done        = s.research.researched.includes(r.id);
    const inProg      = s.research.inProgress?.id === r.id;
    const { available, reason } = researchAvailable(r.id, s);
    const canAfford   = Resources.canAfford(s, r.cost);

    let stateClass = 'rs-node-locked';
    let stateLabel = reason || 'Locked';
    if (done)        { stateClass = 'rs-node-done';    stateLabel = '✓ Complete'; }
    else if (inProg) { stateClass = 'rs-node-active';  stateLabel = '⟳ In Progress'; }
    else if (available) {
      stateClass = canAfford ? 'rs-node-available' : 'rs-node-needs-res';
      stateLabel = canAfford ? 'Available' : 'Need resources';
    }

    const costStr = Object.entries(r.cost)
      .map(([k, v]) => {
        const have = s.resources[k] ?? 0;
        const low  = have < v;
        return `<span class="rs-cost-item ${low ? 'rs-cost-low' : ''}">${v} ${Resources.label(k)}</span>`;
      }).join('');

    const depBadges = r.requires.map(req => {
      const dep = RESEARCH_DEFS[req];
      const met = s.research.researched.includes(req);
      return `<span class="rs-dep ${met ? 'rs-dep-met' : 'rs-dep-unmet'}">${dep?.label ?? req}</span>`;
    }).join('');

    const progressBar = inProg ? (() => {
      const pct = Math.round((1 - s.research.inProgress.hoursRemaining / r.hours) * 100);
      return `<div class="rs-node-prog"><div class="rs-node-prog-fill" style="width:${pct}%"></div></div>`;
    })() : '';

    return `
      <div class="rs-node ${stateClass}" data-id="${r.id}">
        <div class="rs-node-header">
          <span class="rs-node-glyph">${r.glyph}</span>
          <div class="rs-node-meta">
            <div class="rs-node-label">${r.label}</div>
            <span class="rs-node-state-badge rs-state-${stateClass.replace('rs-node-','')}">${stateLabel}</span>
          </div>
        </div>
        <div class="rs-node-effect dim">${r.effect}</div>
        ${progressBar}
        <div class="rs-node-footer">
          <div class="rs-node-costs">${costStr}</div>
          <div class="rs-node-hours dim">${r.hours}h</div>
        </div>
        ${depBadges ? `<div class="rs-node-deps">${depBadges}</div>` : ''}
        ${!done && !inProg && available && canAfford
          ? `<button class="btn rs-start-btn" onclick="Research.startResearch('${r.id}')">Research</button>`
          : !done && !inProg && available && !canAfford
          ? `<button class="btn rs-start-btn rs-start-disabled" disabled>Insufficient Resources</button>`
          : ''}
      </div>`;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  function setFilter(cat) {
    _filterCat = cat;
    if (State.isReady()) renderScreen(State.get());
  }

  function startResearch(id) {
    if (!State.isReady()) return;
    const s   = State.get();
    const def = RESEARCH_DEFS[id];
    if (!def) return;

    if (s.research.inProgress) {
      UI.showNotification('Research already in progress. Cancel it first.', 'warn');
      return;
    }

    const { available, reason } = researchAvailable(id, s);
    if (!available) { UI.showNotification(reason, 'warn'); return; }

    Resources.spend(s, def.cost);
    s.research.inProgress = { id, hoursRemaining: def.hours };
    Engine.log('info', `Research started: ${def.label}. Estimated completion: ${def.hours}h.`);
    renderScreen(s);
    UI.updateResourceDisplay(s);
  }

  function cancelResearch() {
    if (!State.isReady()) return;
    const s = State.get();
    if (!s.research.inProgress) return;
    const def = RESEARCH_DEFS[s.research.inProgress.id];
    // Refund 50% of resources
    if (def?.cost) {
      Object.entries(def.cost).forEach(([k, v]) => {
        Resources.add(s, k, Math.floor(v * 0.5));
      });
    }
    Engine.log('info', `Research cancelled: ${def?.label ?? '???'}. 50% resources refunded.`);
    s.research.inProgress = null;
    renderScreen(s);
    UI.updateResourceDisplay(s);
  }

  // ── Tick hook — called by engine when research completes ─────────────────

  /**
   * Apply all passive effects of completed research to game state.
   * Called once when research completes (from engine._processResearch).
   */
  function applyCompletionEffects(id, s, logFn) {
    const def = RESEARCH_DEFS[id];
    if (!def?.effects) return;
    const fx = def.effects;
    logFn('benefit', `Research complete: ${def.label}. ${def.effect}`);

    // Storage bonuses
    if (fx.storageBonus) {
      // Handled at resource-cap-calc time, no immediate state change needed
    }

    // Power bonuses (applied at power calc time)

    // Passive decoding per day (tracked in flags)
    if (fx.passiveDecodingPerDay) {
      s.flags.passiveDecoding = (s.flags.passiveDecoding ?? 0) + fx.passiveDecodingPerDay;
    }

    // Win condition parts
    if (fx.winConditionPart) {
      s.flags.zpmInterfaceResearched = true;
    }

    // Unlock feature flags
    if (fx.unlockFeature) {
      s.flags[fx.unlockFeature] = true;
    }

    // Replicator immunity
    if (fx.replicatorImmunity) s.flags.replicatorImmunity = true;
  }

  // ── Effect query helpers (read-only, used by other modules) ─────────────

  /**
   * Sum a numeric effect across all completed research.
   * @param {GameState} s
   * @param {string} effectKey — key in def.effects
   * @returns {number}
   */
  function sumEffect(s, effectKey) {
    return s.research.researched.reduce((acc, id) => {
      const fx = RESEARCH_DEFS[id]?.effects;
      if (!fx || fx[effectKey] === undefined) return acc;
      const v = fx[effectKey];
      return acc + (typeof v === 'number' ? v : 0);
    }, 0);
  }

  /**
   * Check if a specific item type has been unlocked by research.
   */
  function isItemUnlocked(s, itemType) {
    // Items start unlocked if their recipe has no requiresResearch
    const def = ITEM_CATALOGUE?.[itemType] ?? itemById(itemType);
    if (!def?.craftable) return false;
    const reqs = def.recipe?.requiresResearch ?? [];
    return reqs.every(r => s.research.researched.includes(r));
  }

  /**
   * Get total power reduction from all research effects.
   */
  function roomPowerReduction(s) {
    return sumEffect(s, 'roomPowerReduction');
  }

  /**
   * Get total power core bonus from research.
   */
  function powerCoreBonus(s) {
    return sumEffect(s, 'powerCoreBonus');
  }

  /**
   * Get hydroponics food bonus.
   */
  function hydroponicsBonus(s) {
    return sumEffect(s, 'hydroponicsBonus');
  }

  /**
   * Get med bay heal multiplier (additive bonuses from multiple research).
   */
  function medBayHealBonus(s) {
    return sumEffect(s, 'medBayHealBonus');
  }

  /**
   * Get build time reduction factor (0–1, applied as multiplier reduction).
   */
  function buildTimeReduction(s) {
    return sumEffect(s, 'buildTimeReduction');
  }

  /**
   * Get craft speed bonus (multiplier reduction on craft hours).
   */
  function craftSpeedBonus(s) {
    return sumEffect(s, 'craftSpeedBonus');
  }

  return {
    renderScreen,
    setFilter,
    startResearch,
    cancelResearch,
    applyCompletionEffects,
    // Effect queries
    sumEffect,
    isItemUnlocked,
    roomPowerReduction,
    powerCoreBonus,
    hydroponicsBonus,
    medBayHealBonus,
    buildTimeReduction,
    craftSpeedBonus,
  };

})();
