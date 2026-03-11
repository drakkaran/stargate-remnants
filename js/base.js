/**
 * STARGATE: REMNANTS — Base
 * All 11 room definitions, build menu, construction management,
 * and the base diagram renderer.
 */

const Base = (() => {

  // ── Room Definitions ─────────────────────────────────────────────────────

  /**
   * Complete definitions for all 11 rooms.
   * cost:      resources required to build (free in dev mode)
   * buildHours: in-game hours to complete construction
   * powerCost:  power consumed per day (0 = free)
   * unique:     only one can be built
   * requires:   room types that must exist before this can be built
   * requiresResearch: research IDs that must be completed before available
   * effect:     short human-readable description of what it does
   * detailLines: longer bullet points for the build menu
   */
  const ROOMS = Object.freeze({

    gate_room: {
      type:        'gate_room',
      label:       'Gate Room',
      glyph:       '◎',
      svgClass:    'room-gate',
      cost:        {},
      buildHours:  0,
      powerCost:   0,
      unique:      true,
      default:     true,  // installed at game start
      requires:    [],
      requiresResearch: [],
      effect:      'Houses the Stargate. Required for all off-world travel.',
      detailLines: [
        'Allows manual dialing of gate addresses',
        'Required for gate teams to depart and return',
        'Cannot be deconstructed',
      ],
      gridPos:     { col: 1, row: 2 }, // base diagram position (col 1–5, row 1–3)
    },

    control_room: {
      type:        'control_room',
      label:       'Control Room',
      glyph:       '⌨',
      svgClass:    'room-control',
      cost:        {},
      buildHours:  0,
      powerCost:   0,
      unique:      true,
      default:     true,
      requires:    [],
      requiresResearch: [],
      effect:      'Base command hub. Logs all events. Free to operate.',
      detailLines: [
        'Displays the full event log',
        'Required for base management functions',
        'Zero power consumption',
      ],
      gridPos:     { col: 2, row: 2 },
    },

    barracks: {
      type:        'barracks',
      label:       'Barracks',
      glyph:       '🛏',
      svgClass:    'room-barracks',
      cost:        { naquadah: 15, alloys: 5 },
      buildHours:  4,
      powerCost:   1,
      unique:      true,
      default:     false,
      requires:    [],
      requiresResearch: [],
      effect:      'Increases base capacity, enabling recruitment of more personnel.',
      detailLines: [
        'Unlocks the ability to recruit personnel from off-world missions',
        'Increases maximum personnel capacity by 4',
        'Costs 1 power per day',
      ],
      gridPos:     { col: 3, row: 1 },
    },

    power_core: {
      type:        'power_core',
      label:       'Power Core',
      glyph:       '⚡',
      svgClass:    'room-power',
      cost:        { naquadah: 15, crystals: 4 },
      buildHours:  6,
      powerCost:   0,  // special: generates power, doesn't consume it
      unique:      true,
      default:     false,
      requires:    [],
      requiresResearch: [],
      effect:      'Generates +2 power per day. Mark II upgrade doubles output.',
      detailLines: [
        'Generates +2 power/day (base)',
        'Mark II Power Core research upgrades to +4 power/day',
        'Does not consume power — it is the source',
        'Essential before building multiple rooms',
      ],
      gridPos:     { col: 4, row: 1 },
    },

    workshop: {
      type:        'workshop',
      label:       'Workshop',
      glyph:       '🔧',
      svgClass:    'room-workshop',
      cost:        { naquadah: 15, alloys: 10 },
      buildHours:  4,
      powerCost:   1,
      unique:      true,
      default:     false,
      requires:    [],
      requiresResearch: [],
      effect:      'Enables crafting of items and refining of basic resources into advanced ones.',
      detailLines: [
        'Unlocks the crafting system',
        'Craft weapons, armour, scanners, and medical kits',
        'Refine basic resources into advanced alloys and components',
        'One item crafted at a time',
      ],
      gridPos:     { col: 5, row: 1 },
    },

    research_lab: {
      type:        'research_lab',
      label:       'Research Lab',
      glyph:       '🔬',
      svgClass:    'room-research',
      cost:        { naquadah: 18, data: 8 },
      buildHours:  6,
      powerCost:   1,
      unique:      true,
      default:     false,
      requires:    [],
      requiresResearch: [],
      effect:      'Generates +1 data/tick. Unlocks the technology research tree.',
      detailLines: [
        'Generates +1 data per in-game hour (24/day)',
        'Unlocks the technology tree screen',
        'Required for most advanced room upgrades',
        'Some technologies only available here after off-world discovery',
      ],
      gridPos:     { col: 1, row: 1 },
    },

    med_bay: {
      type:        'med_bay',
      label:       'Med Bay',
      glyph:       '➕',
      svgClass:    'room-medbay',
      cost:        { naquadah: 15, medicine: 5 },
      buildHours:  4,
      powerCost:   1,
      unique:      true,
      default:     false,
      requires:    [],
      requiresResearch: [],
      effect:      'Treats wounded personnel. Consumes medicine supplies.',
      detailLines: [
        'Allows injured personnel to be assigned for treatment',
        'Healing speed scales with available medicine',
        'Without a Med Bay, personnel health can only recover off-world',
        'Costs 1 power per day',
      ],
      gridPos:     { col: 2, row: 1 },
    },

    training_hall: {
      type:        'training_hall',
      label:       'Training Hall',
      glyph:       '🥊',
      svgClass:    'room-training',
      cost:        { naquadah: 12, alloys: 8 },
      buildHours:  4,
      powerCost:   1,
      unique:      true,
      default:     false,
      requires:    [],
      requiresResearch: [],
      effect:      'Personnel can train one stat at a time. +1 per 24 in-game hours.',
      detailLines: [
        'Allows assignment of personnel to stat training',
        'Each stat trains independently: Combat, Diplomacy, Science, Survival',
        'Takes 24 in-game hours per stat level (max level 10)',
        'Training auto-stops at max level',
      ],
      gridPos:     { col: 3, row: 3 },
    },

    storage: {
      type:        'storage',
      label:       'Storage',
      glyph:       '📦',
      svgClass:    'room-storage',
      cost:        { naquadah: 10, alloys: 5 },
      buildHours:  3,
      powerCost:   1,
      unique:      true,
      default:     false,
      requires:    [],
      requiresResearch: [],
      effect:      'Doubles the resource storage cap (150 → 300 for all resources).',
      detailLines: [
        'Doubles maximum storage cap from 150 to 300 for all resources',
        'Immediately effective upon construction completion',
        'Essential for long off-world expeditions',
        'Costs 1 power per day',
      ],
      gridPos:     { col: 5, row: 2 },
    },

    armory: {
      type:        'armory',
      label:       'Armory',
      glyph:       '🗡',
      svgClass:    'room-armory',
      cost:        { naquadah: 15, alloys: 10, crystals: 5 },
      buildHours:  4,
      powerCost:   1,
      unique:      true,
      default:     false,
      requires:    ['workshop'],
      requiresResearch: [],
      effect:      'Stores crafted items. Allows equipping items to personnel.',
      detailLines: [
        'Stores all crafted and found items',
        'Allows items to be assigned to personnel (weapons, armour, kits)',
        'Requires Workshop to be operational',
        'Assigned items boost personnel stats or grant special buffs',
      ],
      gridPos:     { col: 4, row: 3 },
    },

    hydroponics: {
      type:        'hydroponics',
      label:       'Hydroponics',
      glyph:       '🌱',
      svgClass:    'room-hydro',
      cost:        { naquadah: 10, rarePlants: 3, data: 3 },
      buildHours:  5,
      powerCost:   1,
      unique:      true,
      default:     false,
      requires:    [],
      requiresResearch: [],
      effect:      'Generates +1 food per tick (24/day). Advanced Hydroponics doubles this.',
      detailLines: [
        'Generates +1 food per in-game hour (24 food/day)',
        'Advanced Hydroponics research upgrade doubles output to +2/tick',
        'Reduces dependency on off-world food gathering',
        'Costs 1 power per day',
      ],
      gridPos:     { col: 5, row: 3 },
    },

  });

  // ── Build Menu ────────────────────────────────────────────────────────────

  /**
   * Return array of room defs available to build in current state.
   * Filters out: already built rooms, rooms with unmet prerequisites.
   * @param {GameState} s
   * @returns {object[]} array of room definitions
   */
  function getAvailableRooms(s) {
    return Object.values(ROOMS).filter(def => {
      // Skip default rooms (never buildable)
      if (def.default) return false;
      // Skip already built (even if constructing)
      if (s.rooms.some(r => r.type === def.type)) return false;
      // Check room prerequisites
      for (const req of def.requires) {
        if (!s.rooms.some(r => r.type === req && !r.constructing)) return false;
      }
      // Check research prerequisites
      for (const req of def.requiresResearch) {
        if (!s.research.researched.includes(req)) return false;
      }
      return true;
    });
  }

  /**
   * Attempt to start construction of a room.
   * @param {GameState} s
   * @param {string} type - room type key
   * @returns {{ ok: boolean, reason?: string }}
   */
  function buildRoom(s, type) {
    const def = ROOMS[type];
    if (!def) return { ok: false, reason: 'Unknown room type.' };
    if (def.default) return { ok: false, reason: 'This room is built by default.' };
    if (s.rooms.some(r => r.type === type)) return { ok: false, reason: `${def.label} already exists.` };

    // Dev mode: free
    const cost = s.ui.devMode ? {} : def.cost;
    if (!Resources.canAfford(s, cost)) {
      const missing = Object.entries(def.cost)
        .filter(([k, v]) => (s.resources[k] ?? 0) < v)
        .map(([k, v]) => `${v} ${k}`)
        .join(', ');
      return { ok: false, reason: `Insufficient resources: ${missing}.` };
    }

    Resources.spend(s, cost);

    const hoursRemaining = s.ui.devMode ? 0 : def.buildHours;
    const room = {
      id:            `${type}_${Date.now()}`,
      type,
      level:         1,
      constructing:  hoursRemaining > 0,
      hoursRemaining,
    };

    s.rooms.push(room);

    // If dev mode or instant (0 hours), mark complete immediately
    if (hoursRemaining === 0) {
      room.constructing = false;
    }

    // Recalculate storage cap in case it was a Storage room
    s.resourceCap = Resources.calcCap(s);

    return { ok: true, room };
  }

  /**
   * Tick construction timers for all rooms under construction.
   * Calls the provided log function on completion.
   * @param {GameState} s
   * @param {Function} logFn - (type, message) => void
   * @returns {string[]} types of rooms that just completed
   */
  function tickConstruction(s, logFn) {
    const completed = [];
    s.rooms.forEach(r => {
      if (!r.constructing) return;
      r.hoursRemaining = Math.max(0, r.hoursRemaining - 1);
      if (r.hoursRemaining === 0) {
        r.constructing = false;
        completed.push(r.type);
        // Storage room: immediately recalculate cap
        if (r.type === 'storage') {
          s.resourceCap = Resources.calcCap(s);
          logFn('benefit', `Storage complete — capacity doubled to ${s.resourceCap}.`);
        } else {
          logFn('benefit', `${ROOMS[r.type]?.label ?? r.type} construction complete.`);
        }
      }
    });
    return completed;
  }

  // ── Base Diagram Renderer ─────────────────────────────────────────────────

  /**
   * Render the base diagram into #base-diagram.
   * Uses a schematic grid layout with corridor connectors.
   * @param {GameState} s
   */
  function renderDiagram(s) {
    const container = document.getElementById('base-diagram');
    if (!container) return;

    const installedTypes = new Set(s.rooms.map(r => r.type));

    // Build a 5×3 grid map
    const grid = {}; // key: "col,row" → room def or null
    Object.values(ROOMS).forEach(def => {
      if (def.gridPos) {
        grid[`${def.gridPos.col},${def.gridPos.row}`] = def;
      }
    });

    const COLS = 5;
    const ROWS = 3;

    let html = '<div class="base-schematic">';

    for (let row = 1; row <= ROWS; row++) {
      html += '<div class="schematic-row">';
      for (let col = 1; col <= COLS; col++) {
        const def = grid[`${col},${row}`];
        if (!def) {
          html += '<div class="schematic-cell schematic-empty"></div>';
          continue;
        }

        const installed   = installedTypes.has(def.type);
        const roomState   = installed ? s.rooms.find(r => r.type === def.type) : null;
        const isDefault   = def.default;
        const isBuilding  = roomState?.constructing ?? false;
        const availToBuild = !installed && getAvailableRooms(s).some(d => d.type === def.type);
        const locked      = !installed && !availToBuild && !isDefault;

        let cellClass = 'schematic-cell';
        if (isDefault || (installed && !isBuilding))  cellClass += ' cell-active';
        if (isBuilding)                               cellClass += ' cell-building';
        if (availToBuild)                             cellClass += ' cell-available';
        if (locked)                                   cellClass += ' cell-locked';

        html += `
          <div class="${cellClass}" data-type="${def.type}"
               onclick="Base.handleCellClick('${def.type}')"
               title="${def.label}: ${def.effect}">
            <div class="cell-glyph">${def.glyph}</div>
            <div class="cell-name">${def.label}</div>
            ${isBuilding
              ? `<div class="cell-status building-timer" data-type="${def.type}">${roomState.hoursRemaining}h</div>`
              : installed
                ? `<div class="cell-status">Lv ${roomState.level}</div>`
                : availToBuild
                  ? '<div class="cell-status build-prompt">Build</div>'
                  : '<div class="cell-status locked-label">Locked</div>'
            }
            ${def.powerCost === 0 && !def.default
              ? '' // power cores shown specially
              : def.powerCost > 0 && installed && !isBuilding
                ? `<div class="cell-power">−${def.powerCost}⚡</div>`
                : ''}
          </div>`;

        // Add corridor connector between cells (not after last col)
        if (col < COLS) {
          html += '<div class="corridor-h"></div>';
        }
      }
      html += '</div>'; // .schematic-row

      // Vertical corridors between rows
      if (row < ROWS) {
        html += '<div class="schematic-vrow">';
        for (let col = 1; col <= COLS; col++) {
          const above = grid[`${col},${row}`];
          const below = grid[`${col},${row + 1}`];
          const showV = above || below;
          html += `<div class="corridor-v-wrap">${showV ? '<div class="corridor-v"></div>' : ''}</div>`;
          if (col < COLS) html += '<div class="corridor-v-spacer"></div>';
        }
        html += '</div>';
      }
    }

    html += '</div>'; // .base-schematic

    container.innerHTML = html;
  }

  /**
   * Render the build menu panel into #build-menu-panel.
   * @param {GameState} s
   */
  function renderBuildMenu(s) {
    const panel = document.getElementById('build-menu-panel');
    if (!panel) return;

    const available = getAvailableRooms(s);

    if (available.length === 0) {
      panel.innerHTML = '<p class="dim" style="font-size:var(--font-sz-sm);padding:var(--sp-3)">All rooms constructed or no prerequisites met.</p>';
      return;
    }

    panel.innerHTML = available.map(def => {
      const canBuild = s.ui.devMode || Resources.canAfford(s, def.cost);
      const costHtml = Object.entries(def.cost).map(([k, v]) => {
        const have    = s.resources[k] ?? 0;
        const enough  = have >= v || s.ui.devMode;
        return `<span class="cost-item ${enough ? '' : 'cost-missing'}">${v} ${k}</span>`;
      }).join('');

      return `
        <div class="build-card ${canBuild ? '' : 'build-unaffordable'}">
          <div class="build-card-header">
            <span class="build-glyph">${def.glyph}</span>
            <div class="build-card-info">
              <div class="build-label">${def.label}</div>
              <div class="build-effect dim">${def.effect}</div>
            </div>
            <div class="build-meta">
              <div class="build-time dim">⏱ ${def.buildHours}h</div>
              ${def.powerCost > 0 ? `<div class="build-power dim">−${def.powerCost}⚡/day</div>` : `<div class="build-power olive">No power cost</div>`}
            </div>
          </div>
          <div class="build-cost">
            ${costHtml || '<span class="dim">Free</span>'}
          </div>
          <button class="btn btn-olive build-confirm-btn"
                  ${canBuild ? '' : 'disabled'}
                  onclick="Base.confirmBuild('${def.type}')">
            ${canBuild ? '+ Construct' : 'Insufficient Resources'}
          </button>
        </div>`;
    }).join('');
  }

  /**
   * Render the room detail panel for a selected installed room.
   * @param {GameState} s
   * @param {string} type
   */
  function renderRoomDetail(s, type) {
    const panel  = document.getElementById('room-detail-panel');
    const def    = ROOMS[type];
    const room   = s.rooms.find(r => r.type === type);
    if (!panel || !def || !room) return;

    const isBuilding = room.constructing;

    panel.innerHTML = `
      <div class="rd-header">
        <span class="rd-glyph">${def.glyph}</span>
        <div>
          <div class="rd-name">${def.label}</div>
          <div class="dim" style="font-size:var(--font-sz-xs)">${isBuilding ? `Under construction — ${room.hoursRemaining}h remaining` : `Level ${room.level} · ${def.powerCost > 0 ? `−${def.powerCost}⚡/day` : 'No power cost'}`}</div>
        </div>
      </div>
      <div class="rd-effect">${def.effect}</div>
      <ul class="rd-details">
        ${def.detailLines.map(l => `<li>${l}</li>`).join('')}
      </ul>
      ${isBuilding ? `
        <div class="rd-progress">
          <div class="rd-progress-label">Construction progress</div>
          <div class="rd-progress-bar">
            <div class="rd-progress-fill" style="width:${Math.round((1 - room.hoursRemaining / def.buildHours) * 100)}%"></div>
          </div>
        </div>` : ''}
      <button class="btn btn-ghost" style="margin-top:var(--sp-3)" onclick="Base.closeRoomDetail()">✕ Close</button>
    `;

    panel.classList.add('open');
  }

  // ── Cell click handler ────────────────────────────────────────────────────

  /**
   * Handle click on a schematic cell.
   * - Installed room: show detail panel
   * - Available to build: open build menu filtered to that room
   * - Locked: show reason
   */
  function handleCellClick(type) {
    if (!State.isReady()) return;
    const s    = State.get();
    const room = s.rooms.find(r => r.type === type);
    const def  = ROOMS[type];

    if (room) {
      renderRoomDetail(s, type);
    } else {
      const available = getAvailableRooms(s).some(d => d.type === type);
      if (available) {
        openBuildMenuFor(type);
      } else {
        const prereqRoom    = (def.requires ?? []).find(r => !s.rooms.some(x => x.type === r && !x.constructing));
        const prereqResearch = (def.requiresResearch ?? []).find(r => !s.research.researched.includes(r));
        if (prereqRoom) {
          UI.showNotification(`Requires ${ROOMS[prereqRoom]?.label ?? prereqRoom} first.`, 'warn');
        } else if (prereqResearch) {
          UI.showNotification(`Requires research: ${prereqResearch}.`, 'warn');
        } else {
          UI.showNotification(`${def.label} is already built.`, 'info');
        }
      }
    }
  }

  /**
   * Open the build menu showing a specific room.
   * @param {string} type
   */
  function openBuildMenuFor(type) {
    if (!State.isReady()) return;
    const s = State.get();
    const panel = document.getElementById('build-modal');
    if (!panel) return;
    renderBuildMenuFull(s, type);
    panel.classList.add('open');
  }

  /**
   * Full build menu modal render.
   * @param {GameState} s
   * @param {string|null} highlightType
   */
  function renderBuildMenuFull(s, highlightType = null) {
    renderBuildMenu(s);
    // Scroll to highlighted room if provided
    if (highlightType) {
      requestAnimationFrame(() => {
        const el = document.querySelector(`.build-card[data-type="${highlightType}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }

  /**
   * Execute building after user confirmation.
   * @param {string} type
   */
  function confirmBuild(type) {
    if (!State.isReady()) return;
    const s   = State.get();
    const def = ROOMS[type];
    const result = buildRoom(s, type);

    if (!result.ok) {
      UI.showNotification(result.reason, 'warn');
      return;
    }

    const msg = result.room.constructing
      ? `${def.label} construction started — ${def.buildHours}h remaining.`
      : `${def.label} built instantly (dev mode).`;

    Engine.log('benefit', msg);
    UI.showNotification(msg, 'success');

    // Re-render
    renderDiagram(s);
    renderBuildMenu(s);
    UI.updateResourceDisplay(s);

    // Close modal if nothing left to build
    if (getAvailableRooms(s).length === 0) {
      closeBuildModal();
    }
  }

  function closeBuildModal() {
    document.getElementById('build-modal')?.classList.remove('open');
  }

  function closeRoomDetail() {
    document.getElementById('room-detail-panel')?.classList.remove('open');
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    ROOMS,
    getAvailableRooms,
    buildRoom,
    tickConstruction,
    renderDiagram,
    renderBuildMenu,
    renderBuildMenuFull,
    renderRoomDetail,
    handleCellClick,
    openBuildMenuFor,
    confirmBuild,
    closeBuildModal,
    closeRoomDetail,
  };

})();
