/**
 * STARGATE: REMNANTS — Item Definitions
 * All craftable items with their recipes, stat bonuses, and metadata.
 *
 * Each item:
 *   id           string  — unique key, stored in s.items[].type
 *   label        string  — display name
 *   category     string  — 'armour' | 'weapon' | 'scanner' | 'medical' | 'diplomatic' | 'ancient'
 *   glyph        string  — icon character
 *   statBonus    object  — stat bonuses when equipped { combat?, science?, diplomacy?, survival? }
 *   description  string  — flavour text
 *   craftable    bool    — can be made in Workshop (false = found/recovered only)
 *   recipe       object  — { resources: { key: amount }, hours: n, requiresResearch: string[] }
 *   tier         1–4     — rough power level, matches research tier
 *   stackable    bool    — multiple copies can exist (true for consumables)
 */

const ITEM_CATALOGUE = Object.freeze({

  // ── Tier 1: Basic armour ─────────────────────────────────────────────────

  kevlar_vest: {
    id:          'kevlar_vest',
    label:       'Kevlar Vest',
    category:    'armour',
    tier:        1,
    glyph:       '🛡',
    statBonus:   { combat: 1 },
    description: 'Standard-issue ceramic-fibre body armour. Reduces blunt and ballistic trauma. SGC standard kit for ground teams.',
    craftable:   true,
    recipe: {
      resources:        { alloys: 6, naquadah: 2 },
      hours:            8,
      requiresResearch: ['basic_metallurgy'],
      requiresRoom:     'workshop',
    },
    stackable: true,
  },

  tactical_armour: {
    id:          'tactical_armour',
    label:       'Tactical Armour',
    category:    'armour',
    tier:        2,
    glyph:       '⛨',
    statBonus:   { combat: 2, survival: 1 },
    description: 'Heavy plate-and-ceramic composite armour. Significant combat and survival boost at the cost of mobility. For high-threat environments.',
    craftable:   true,
    recipe: {
      resources:        { alloys: 12, naquadah: 5, crystals: 2 },
      hours:            16,
      requiresResearch: ['basic_metallurgy'],
      requiresRoom:     'workshop',
    },
    stackable: true,
  },

  // ── Tier 2: Weapons ──────────────────────────────────────────────────────

  zat_gun: {
    id:          'zat_gun',
    label:       "Zat'nik'tel",
    category:    'weapon',
    tier:        2,
    glyph:       '⚡',
    statBonus:   { combat: 2 },
    description: "Goa'uld energy weapon. First discharge stuns; the second kills. Recovered and reverse-engineered from captured Jaffa. Reliable in the field.",
    craftable:   true,
    recipe: {
      resources:        { naquadah: 8, crystals: 4, advancedTech: 1 },
      hours:            12,
      requiresResearch: ['combat_training'],
      requiresRoom:     'workshop',
    },
    stackable: true,
  },

  plasma_cannon: {
    id:          'plasma_cannon',
    label:       'Plasma Cannon',
    category:    'weapon',
    tier:        3,
    glyph:       '🔫',
    statBonus:   { combat: 3 },
    description: 'Heavy energy weapon salvaged from a Goa\'uld weapons cache and retrofitted. Devastating firepower. Requires significant power cell maintenance.',
    craftable:   true,
    recipe: {
      resources:        { alloys: 15, naquadah: 12, advancedTech: 4, crystals: 5 },
      hours:            24,
      requiresResearch: ['advanced_alloys'],
      requiresRoom:     'workshop',
    },
    stackable: true,
  },

  // ── Tier 2: Scanners & tech ──────────────────────────────────────────────

  data_pad: {
    id:          'data_pad',
    label:       'Data Pad',
    category:    'scanner',
    tier:        1,
    glyph:       '📱',
    statBonus:   { science: 1, diplomacy: 1 },
    description: 'Compact multi-function analysis unit. Assists in field research, artefact reading, and diplomatic negotiation. Standard issue.',
    craftable:   true,
    recipe: {
      resources:        { crystals: 3, data: 4 },
      hours:            6,
      requiresResearch: [],
      requiresRoom:     'workshop',
    },
    stackable: true,
  },

  long_range_scanner: {
    id:          'long_range_scanner',
    label:       'LR Scanner',
    category:    'scanner',
    tier:        2,
    glyph:       '📡',
    statBonus:   { science: 2 },
    description: 'Detects life signs and Ancient technology signatures at long range. Invaluable for reconnaissance and excavation missions.',
    craftable:   true,
    recipe: {
      resources:        { crystals: 8, advancedTech: 3, data: 5 },
      hours:            14,
      requiresResearch: ['perimeter_sensors'],
      requiresRoom:     'workshop',
    },
    stackable: true,
  },

  // ── Tier 2/3: Medical ────────────────────────────────────────────────────

  medkit: {
    id:          'medkit',
    label:       'Medical Kit',
    category:    'medical',
    tier:        2,
    glyph:       '⛑',
    statBonus:   { survival: 2 },
    description: 'Comprehensive trauma kit with field surgery supplies, coagulants, and broad-spectrum antibiotics. Significantly boosts survival under fire.',
    craftable:   true,
    recipe: {
      resources:        { medicine: 8, rarePlants: 3, alloys: 2 },
      hours:            10,
      requiresResearch: ['xenobiology'],
      requiresRoom:     'workshop',
    },
    stackable: true,
  },

  stims: {
    id:          'stims',
    label:       'Combat Stims',
    category:    'medical',
    tier:        2,
    glyph:       '💉',
    statBonus:   { combat: 1, survival: 1 },
    description: 'Regulated adrenaline, clotting agents, and pain suppressors in a single injector. Short-duration performance enhancement. Double-edged — overuse has consequences.',
    craftable:   true,
    recipe: {
      resources:        { medicine: 5, rarePlants: 4, advancedTech: 1 },
      hours:            8,
      requiresResearch: ['naquadah_enhanced_weapons'],
      requiresRoom:     'workshop',
    },
    stackable: true,
  },

  // ── Tier 3: Diplomatic ───────────────────────────────────────────────────

  universal_translator: {
    id:          'universal_translator',
    label:       'U-Translator',
    category:    'diplomatic',
    tier:        3,
    glyph:       '💬',
    statBonus:   { diplomacy: 3 },
    description: "An Ancient-derived real-time translation device. Cross-references the gate network's embedded linguistic database. Opens diplomatic doors across languages no human alive speaks.",
    craftable:   true,
    recipe: {
      resources:        { ancientTech: 4, crystals: 8, data: 6 },
      hours:            20,
      requiresResearch: ['diplomatic_protocols'],
      requiresRoom:     'workshop',
    },
    stackable: true,
  },

  // ── Tier 3/4: Ancient tech ───────────────────────────────────────────────

  ancient_device: {
    id:          'ancient_device',
    label:       'Ancient Device',
    category:    'ancient',
    tier:        3,
    glyph:       '⌬',
    statBonus:   { science: 3 },
    description: 'A portable Ancient research artefact inscribed with crystalline data matrices. Boosts understanding of Ancient technology, accelerates field analysis, and hums softly at all times.',
    craftable:   true,
    recipe: {
      resources:        { ancientTech: 6, crystals: 10, artifacts: 4 },
      hours:            28,
      requiresResearch: ['ancient_tech_study'],
      requiresRoom:     'workshop',
    },
    stackable: true,
  },

  // ── Found-only items (not craftable, recovered from missions) ────────────

  gould_ribbon: {
    id:          'gould_ribbon',
    label:       "Goa'uld Ribbon Device",
    category:    'weapon',
    tier:        3,
    glyph:       '☀',
    statBonus:   { combat: 2, science: 1 },
    description: "Requires a Goa'uld symbiote or naquadah in the bloodstream to operate — but your engineers have found a workaround. Recovered from a System Lord's vault. Handle carefully.",
    craftable:   false,
    recipe:      null,
    stackable:   false,
  },

  tok_ra_symbiote_doc: {
    id:          'tok_ra_symbiote_doc',
    label:       "Tok'ra Communiqué",
    category:    'diplomatic',
    tier:        2,
    glyph:       '📜',
    statBonus:   { diplomacy: 2, science: 1 },
    description: "A sealed diplomatic document from a Tok'ra operative, providing introduction to allied worlds. Confers diplomatic standing on bearer. Single-use in narrative terms.",
    craftable:   false,
    recipe:      null,
    stackable:   false,
  },

  nox_healing_plant: {
    id:          'nox_healing_plant',
    label:       'Nox Healing Plant',
    category:    'medical',
    tier:        3,
    glyph:       '🌿',
    statBonus:   { survival: 3 },
    description: 'A cutting from a Nox healing plant. Still alive and responsive. Its presence on a person seems to accelerate natural cellular repair processes far beyond any known medicine.',
    craftable:   false,
    recipe:      null,
    stackable:   false,
  },

});

/**
 * Get all craftable items as an array, sorted by tier.
 */
function craftableItems() {
  return Object.values(ITEM_CATALOGUE)
    .filter(i => i.craftable)
    .sort((a, b) => a.tier - b.tier || a.label.localeCompare(b.label));
}

/**
 * Get item def by id.
 * @param {string} id
 */
function itemById(id) {
  return ITEM_CATALOGUE[id];
}

/**
 * Get all items whose recipe's requiresResearch list is satisfied by s.research.researched[].
 * @param {GameState} s
 */
function unlockedCraftable(s) {
  return craftableItems().filter(item => {
    const reqs = item.recipe?.requiresResearch ?? [];
    return reqs.every(r => s.research.researched.includes(r));
  });
}


/**
 * STARGATE: REMNANTS — Items / Armoury Module  (Phase 6)
 *
 * Standalone Armoury screen: view all inventory items, assign them to personnel,
 * and see stat bonuses previewed before assignment. Also exposes helpers used
 * by other modules (Personnel, Missions) for item queries.
 *
 * Rendered into #armoury-scene.
 *
 * Public API
 *   renderScreen(s)                — main entry point
 *   assignItem(s, itemId, pId)     — equip; delegates to Personnel.equipItem
 *   unassignItem(s, itemId)        — unequip by item id
 *   destroyItem(s, itemId)         — remove item permanently from s.items
 *   getItemDef(type)               — look up def from ITEM_CATALOGUE
 *   getAllForPersonnel(s, pId)      — items available to a given person
 *   equippedItem(s, p)             — { item, def } currently equipped by p, or null
 */

const Armoury = (() => {

  // ── Internal view state ───────────────────────────────────────────────────
  let _view       = 'items';   // 'items' | 'personnel'
  let _selectedItemId = null;  // item selected in item list
  let _filterCat  = 'all';

  // ── Helpers ───────────────────────────────────────────────────────────────

  function getItemDef(type) {
    return ITEM_CATALOGUE[type] ?? null;
  }

  function equippedItem(s, p) {
    if (!p.item) return null;
    const item = s.items.find(i => i.id === p.item);
    if (!item)  return null;
    const def  = getItemDef(item.type);
    return { item, def };
  }

  function getAllForPersonnel(s, personnelId) {
    return s.items.filter(i => !i.assignedTo || i.assignedTo === personnelId);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  function assignItem(s, itemId, personnelId) {
    const result = Personnel.equipItem(s, personnelId, itemId);
    if (result.ok) {
      const item = s.items.find(i => i.id === itemId);
      const def  = getItemDef(item?.type);
      const p    = s.personnel.find(p => p.id === personnelId);
      Engine.log('info', `Armoury: ${def?.label ?? itemId} assigned to ${p?.name ?? personnelId}.`);
      UI.showNotification(`${def?.glyph ?? ''} ${def?.label} → ${p?.name}`, 'success');
      renderScreen(s);
    } else {
      UI.showNotification(result.reason ?? 'Cannot assign.', 'warn');
    }
  }

  function unassignItem(s, itemId) {
    const item = s.items.find(i => i.id === itemId);
    if (!item?.assignedTo) return;
    const p    = s.personnel.find(p => p.id === item.assignedTo);
    const def  = getItemDef(item.type);
    const result = Personnel.unequipItem(s, item.assignedTo);
    if (result.ok) {
      Engine.log('info', `Armoury: ${def?.label ?? itemId} unequipped from ${p?.name ?? '?'}.`);
      renderScreen(s);
    }
  }

  function destroyItem(s, itemId) {
    const item = s.items.find(i => i.id === itemId);
    if (!item) return;
    if (item.assignedTo) {
      // Unequip first
      Personnel.unequipItem(s, item.assignedTo);
    }
    const def = getItemDef(item.type);
    s.items   = s.items.filter(i => i.id !== itemId);
    if (_selectedItemId === itemId) _selectedItemId = null;
    Engine.log('info', `Armoury: ${def?.label ?? itemId} decommissioned.`);
    UI.showNotification(`${def?.label ?? itemId} destroyed.`, 'info');
    renderScreen(s);
  }

  // ── Main render ───────────────────────────────────────────────────────────

  function renderScreen(s) {
    const container = document.getElementById('armoury-scene');
    if (!container) return;
    try {
      _renderScreenInner(s, container);
    } catch (err) {
      console.error('[Armoury] renderScreen crashed:', err);
      container.innerHTML = `<div class="arm-no-room"><div class="arm-no-room-title" style="color:var(--c-red-bright)">Armoury Error</div><p class="dim">${err.message}</p></div>`;
    }
  }

  function _renderScreenInner(s, container) {
    const hasArmory = s.rooms.some(r => r.type === 'armory' && !r.constructing);

    if (!hasArmory) {
      container.innerHTML = '';   // nothing — no armory yet, inventory section is still useful
      return;
    }

    // Tab strip
    const tabs = `
      <div class="arm-tabs">
        <button class="arm-tab ${_view === 'items' ? 'arm-tab-active' : ''}"
                onclick="Armoury.setView('items')">⛨ Item Inventory</button>
        <button class="arm-tab ${_view === 'personnel' ? 'arm-tab-active' : ''}"
                onclick="Armoury.setView('personnel')">★ Personnel Equipment</button>
      </div>`;

    const body = _view === 'items'
      ? _renderItemsView(s)
      : _renderPersonnelView(s);

    container.innerHTML = `
      <div class="arm-layout">
        <div class="arm-header">
          <div class="arm-title">Equipment &amp; Armoury</div>
          <div class="dim" style="font-size:14px">${s.items.length} item${s.items.length !== 1 ? 's' : ''} in inventory · ${s.items.filter(i=>i.assignedTo).length} assigned</div>
        </div>
        ${tabs}
        <div class="arm-body">${body}</div>
      </div>`;
  }

  // ── Items view ────────────────────────────────────────────────────────────

  function _renderItemsView(s) {
    if (s.items.length === 0) {
      return `
        <div class="arm-empty">
          <div class="arm-empty-icon">◻</div>
          <div class="arm-empty-title">No Items in Inventory</div>
          <p class="dim">Craft items in the Workshop to equip your team.</p>
          <button class="btn btn-olive" onclick="UI.navigateTo('crafting')">→ Workshop</button>
        </div>`;
    }

    // Category filter
    const cats = ['all', ...new Set(s.items.map(i => ITEM_CATALOGUE[i.type]?.category ?? 'other'))];
    const filterHtml = cats.map(cat => `
      <button class="arm-filter ${_filterCat === cat ? 'arm-filter-active' : ''}"
              onclick="Armoury.setFilter('${cat}')">${cat}</button>`
    ).join('');

    const filtered = s.items.filter(i =>
      _filterCat === 'all' || ITEM_CATALOGUE[i.type]?.category === _filterCat
    );

    const itemRows = filtered.map(item => {
      const def       = getItemDef(item.type);
      const isSel     = _selectedItemId === item.id;
      const assignee  = item.assignedTo
        ? s.personnel.find(p => p.id === item.assignedTo)
        : null;

      // Stat bonus chips
      const bonusChips = Object.entries(def?.statBonus ?? {}).map(([k, v]) =>
        `<span class="arm-bonus-chip arm-chip-${k}">+${v} ${k}</span>`
      ).join('');

      // Available assignees (not off-world, alive, no conflicting item)
      const available = s.personnel.filter(p =>
        p.alive && !p.offWorld && (!p.item || p.item === item.id)
      );

      const assignDropdown = !item.assignedTo && available.length > 0 ? `
        <select class="arm-assign-select" onchange="Armoury.handleAssignSelect('${item.id}', this.value)">
          <option value="">— Assign to —</option>
          ${available.map(p => `<option value="${p.id}">${p.name} (${p.archetype})</option>`).join('')}
        </select>` : '';

      return `
        <div class="arm-item ${isSel ? 'arm-item-selected' : ''} ${item.assignedTo ? 'arm-item-assigned' : ''}"
             onclick="Armoury.selectItem('${item.id}')">
          <div class="arm-item-header">
            <span class="arm-item-glyph">${def?.glyph ?? '?'}</span>
            <div class="arm-item-meta">
              <span class="arm-item-name">${def?.label ?? item.type}</span>
              <span class="arm-item-cat dim">T${def?.tier ?? '?'} ${def?.category ?? ''}</span>
            </div>
            <div class="arm-item-bonuses">${bonusChips}</div>
            <div class="arm-item-status">
              ${assignee
                ? `<span class="arm-assignee-badge">${assignee.name}</span>`
                : `<span class="arm-unassigned-badge dim">unassigned</span>`}
            </div>
          </div>

          ${isSel ? `
            <div class="arm-item-detail" onclick="event.stopPropagation()">
              <div class="arm-item-desc dim">${def?.description ?? ''}</div>
              <div class="arm-item-actions">
                ${assignDropdown}
                ${item.assignedTo
                  ? `<button class="btn btn-ghost arm-unassign-btn"
                             onclick="event.stopPropagation(); Armoury.unassignItem(State.get(), '${item.id}')">
                       Unequip from ${assignee?.name ?? '?'}
                     </button>`
                  : ''}
                <button class="btn btn-red arm-destroy-btn"
                        onclick="event.stopPropagation(); Armoury.confirmDestroy('${item.id}')">
                  Decommission
                </button>
              </div>
            </div>` : ''}
        </div>`;
    }).join('');

    return `
      <div class="arm-items-layout">
        <div class="arm-filter-row">${filterHtml}</div>
        <div class="arm-item-list">${itemRows}</div>
        <div class="arm-craft-nudge">
          <button class="btn btn-ghost" onclick="UI.navigateTo('crafting')">🔧 Go to Workshop →</button>
        </div>
      </div>`;
  }

  // ── Personnel view ────────────────────────────────────────────────────────

  function _renderPersonnelView(s) {
    const alive = s.personnel.filter(p => p.alive);

    if (!alive.length) {
      return `<div class="arm-empty dim">No active personnel.</div>`;
    }

    const STAT_KEYS = ['combat', 'diplomacy', 'science', 'survival'];
    const STAT_GLYPHS = { combat: '⚔', diplomacy: '🤝', science: '🔬', survival: '🌿' };

    const cards = alive.map(p => {
      const eff       = Personnel.effectiveStats(p, s);
      const equipped  = equippedItem(s, p);
      const available = s.items.filter(i => !i.assignedTo || i.assignedTo === p.id);

      // Stat rows with bonus highlighting
      const statRows = STAT_KEYS.map(k => {
        const base  = p.stats[k] ?? 0;
        const bonus = (eff[k] ?? base) - base;
        return `
          <div class="arm-pers-stat">
            <span class="arm-pers-stat-glyph">${STAT_GLYPHS[k]}</span>
            <div class="arm-pers-stat-bar-wrap">
              <div class="arm-pers-stat-bar">
                <div class="arm-pers-stat-fill" style="width:${(base/10)*100}%"></div>
                ${bonus > 0 ? `<div class="arm-pers-stat-bonus" style="width:${(bonus/10)*100}%; left:${(base/10)*100}%"></div>` : ''}
              </div>
            </div>
            <span class="arm-pers-stat-val">${base}${bonus > 0 ? `<span class="arm-bonus-plus">+${bonus}</span>` : ''}</span>
          </div>`;
      }).join('');

      // Item slot
      const itemSlot = equipped ? `
        <div class="arm-pers-equipped">
          <span class="arm-pers-eq-glyph">${equipped.def?.glyph ?? '?'}</span>
          <span class="arm-pers-eq-name">${equipped.def?.label ?? equipped.item.type}</span>
          <button class="btn btn-ghost arm-pers-unequip"
                  onclick="Armoury.unassignItem(State.get(), '${equipped.item.id}')">✕</button>
        </div>` : `
        <div class="arm-pers-unequipped dim">No item equipped</div>`;

      // Equipment selector: only show unassigned items
      const unassigned = s.items.filter(i => !i.assignedTo);
      const selector = !p.offWorld && unassigned.length > 0 ? `
        <select class="arm-equip-select" onchange="Armoury.handlePersonnelEquip('${p.id}', this.value)">
          <option value="">— Equip item —</option>
          ${unassigned.map(i => {
            const d = getItemDef(i.type);
            const bonusStr = Object.entries(d?.statBonus ?? {}).map(([k,v])=>`+${v} ${k}`).join(' ');
            return `<option value="${i.id}">${d?.glyph ?? ''} ${d?.label ?? i.type} (${bonusStr})</option>`;
          }).join('')}
        </select>` : '';

      const archDef = { combat:'⚔', science:'🔬', balanced:'★', diplomat:'🤝', survivor:'🌿' };

      return `
        <div class="arm-pers-card ${p.offWorld ? 'arm-pers-offworld' : ''}">
          <div class="arm-pers-header">
            <span class="arm-pers-callout">${archDef[p.archetype] ?? '★'}</span>
            <div class="arm-pers-id">
              <span class="arm-pers-name">${p.name}</span>
              <span class="arm-pers-archetype dim">${p.archetype}</span>
            </div>
            <div class="arm-pers-hp dim">${p.health}/${p.maxHealth} HP</div>
            ${p.offWorld ? '<span class="arm-offworld-tag">Off-world</span>' : ''}
          </div>
          <div class="arm-pers-stats">${statRows}</div>
          <div class="arm-pers-equip-section">
            <div class="arm-pers-equip-label">Equipment</div>
            ${itemSlot}
            ${!p.offWorld ? selector : ''}
          </div>
        </div>`;
    }).join('');

    return `<div class="arm-pers-grid">${cards}</div>`;
  }

  // ── UI handlers ───────────────────────────────────────────────────────────

  function setView(v) {
    _view = v;
    _selectedItemId = null;
    if (State.isReady()) renderScreen(State.get());
  }

  function setFilter(cat) {
    _filterCat = cat;
    if (State.isReady()) renderScreen(State.get());
  }

  function selectItem(id) {
    _selectedItemId = _selectedItemId === id ? null : id;
    if (State.isReady()) renderScreen(State.get());
  }

  function handleAssignSelect(itemId, personnelId) {
    if (!personnelId || !State.isReady()) return;
    assignItem(State.get(), itemId, personnelId);
  }

  function handlePersonnelEquip(personnelId, itemId) {
    if (!itemId || !State.isReady()) return;
    assignItem(State.get(), itemId, personnelId);
  }

  function confirmDestroy(itemId) {
    if (!State.isReady()) return;
    const s   = State.get();
    const item = s.items.find(i => i.id === itemId);
    const def  = getItemDef(item?.type);
    // Simple confirm — production game would use a modal
    if (window.confirm(`Permanently decommission ${def?.label ?? itemId}? This cannot be undone.`)) {
      destroyItem(s, itemId);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    renderScreen,
    assignItem,
    unassignItem,
    destroyItem,
    getItemDef,
    getAllForPersonnel,
    equippedItem,
    // UI handlers
    setView,
    setFilter,
    selectItem,
    handleAssignSelect,
    handlePersonnelEquip,
    confirmDestroy,
  };

})();
