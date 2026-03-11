/**
 * STARGATE: REMNANTS — Crafting Module  (Phase 6)
 *
 * Manages the Workshop crafting queue: one item at a time.
 * Renders into #crafting-scene (sub-panel inside the Workshop screen,
 * also accessible via the Research/Crafting combined tab).
 *
 * Public API
 *   renderScreen(s)            — main entry; renders full crafting UI
 *   startCraft(itemType)       — begin crafting; deducts resources
 *   cancelCraft()              — abort current job; 50% resource refund
 *   onComplete(s, logFn)       — called by engine when job finishes
 *   effectiveHours(itemType,s) — hours accounting for research speed bonuses
 */

const Crafting = (() => {

  // ── Internal state ────────────────────────────────────────────────────────
  let _filterCat   = 'all';   // category filter on recipe list
  let _selectedId  = null;    // currently highlighted recipe in list

  // ── Category metadata ─────────────────────────────────────────────────────
  // _craftableItems() — robust wrapper that works regardless of load order or path.
  // Tries (in order): global craftableItems fn, global ITEM_CATALOGUE, window.ITEM_CATALOGUE.
  function _craftableItems() {
    try {
      if (typeof craftableItems === 'function') {
        const result = craftableItems();
        if (result && result.length > 0) return result;
      }
    } catch(e) { /* fall through */ }
    try {
      const cat = (typeof ITEM_CATALOGUE !== 'undefined' ? ITEM_CATALOGUE : null)
               || (typeof window !== 'undefined' && window.ITEM_CATALOGUE);
      if (cat) {
        return Object.values(cat)
          .filter(i => i.craftable)
          .sort((a, b) => a.tier - b.tier || a.label.localeCompare(b.label));
      }
    } catch(e) { /* fall through */ }
    console.warn('[Crafting] ITEM_CATALOGUE not accessible — check data/items.js load path');
    return [];
  }

  const CATEGORIES = Object.freeze([
    { key: 'all',        label: 'All',       glyph: '◈' },
    { key: 'armour',     label: 'Armour',    glyph: '🛡' },
    { key: 'weapon',     label: 'Weapons',   glyph: '⚔' },
    { key: 'scanner',    label: 'Scanners',  glyph: '📡' },
    { key: 'medical',    label: 'Medical',   glyph: '⛑' },
    { key: 'diplomatic', label: 'Diplomatic',glyph: '💬' },
    { key: 'ancient',    label: 'Ancient',   glyph: '⌬' },
  ]);

  // ── Computed effective craft time ─────────────────────────────────────────

  /**
   * Return the actual hours for crafting an item, accounting for research bonuses.
   * @param {string} itemType
   * @param {GameState} s
   * @returns {number}
   */
  function effectiveHours(itemType, s) {
    const def  = ITEM_CATALOGUE[itemType];
    if (!def?.recipe) return 99;
    const base = def.recipe.hours;
    // Research: advanced_alloys grants 20% craft speed reduction
    const bonus = (typeof Research !== 'undefined') ? Research.craftSpeedBonus(s) : 0;
    return Math.max(1, Math.round(base * (1 - bonus)));
  }

  // ── Availability check ────────────────────────────────────────────────────

  /**
   * @returns {{ craftable: bool, reason: string }}
   */
  function canCraft(itemType, s) {
    const def = ITEM_CATALOGUE[itemType];
    if (!def)           return { craftable: false, reason: 'Unknown item.' };
    if (!def.craftable) return { craftable: false, reason: 'Not craftable.' };

    const hasWorkshop = s.rooms.some(r => r.type === 'workshop' && !r.constructing);
    if (!hasWorkshop)   return { craftable: false, reason: 'Workshop required.' };

    // Research prerequisites
    const reqs = def.recipe?.requiresResearch ?? [];
    for (const r of reqs) {
      if (!s.research.researched.includes(r)) {
        const rLabel = RESEARCH_DEFS[r]?.label ?? r;
        return { craftable: false, reason: `Research required: ${rLabel}` };
      }
    }

    // Resource check (waived in dev mode)
    if (!s.ui.devMode && !Resources.canAfford(s, def.recipe.resources)) {
      const missing = Object.entries(def.recipe.resources)
        .filter(([k, v]) => (s.resources[k] ?? 0) < v)
        .map(([k, v]) => `${v - (s.resources[k] ?? 0)} more ${Resources.label(k)}`)
        .join(', ');
      return { craftable: false, reason: `Need: ${missing}` };
    }

    return { craftable: true, reason: '' };
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  function startCraft(itemType) {
    if (!State.isReady()) return;
    const s = State.get();

    if (s.crafting.inProgress) {
      UI.showNotification('Workshop busy — cancel current job first.', 'warn');
      return;
    }

    const { craftable, reason } = canCraft(itemType, s);
    if (!craftable) { UI.showNotification(reason, 'warn'); return; }

    const def   = ITEM_CATALOGUE[itemType];
    const hours = s.ui.devMode ? 0 : effectiveHours(itemType, s);

    if (!s.ui.devMode) Resources.spend(s, def.recipe.resources);
    s.crafting.inProgress = { type: itemType, hoursRemaining: hours, totalHours: Math.max(hours, 1) };

    Engine.log('info', `Workshop: crafting ${def.label} — ${hours}h estimated.`);
    UI.showNotification(`Crafting ${def.label}…`, 'success');
    UI.updateResourceDisplay(s);
    renderScreen(s);
  }

  function cancelCraft() {
    if (!State.isReady()) return;
    const s = State.get();
    if (!s.crafting.inProgress) return;

    const def = ITEM_CATALOGUE[s.crafting.inProgress.type];
    if (def?.recipe?.resources) {
      Object.entries(def.recipe.resources).forEach(([k, v]) => {
        Resources.add(s, k, Math.floor(v * 0.5));
      });
    }

    Engine.log('info', `Workshop: ${def?.label ?? 'job'} cancelled. 50% materials refunded.`);
    s.crafting.inProgress = null;
    renderScreen(s);
    UI.updateResourceDisplay(s);
  }

  /**
   * Called by engine._processCrafting when hoursRemaining hits 0.
   * Pushes item into s.items and fires a notification.
   */
  function onComplete(s, logFn) {
    const type = s.crafting.inProgress?.type;
    if (!type) return;
    const def = ITEM_CATALOGUE[type];
    s.items.push({ id: `item_${Date.now()}_${Math.random().toString(36).slice(2,5)}`, type, assignedTo: null });
    logFn('benefit', `Workshop: ${def?.label ?? type} crafted and added to the Armoury.`);
    UI.showNotification(`${def?.glyph ?? ''} ${def?.label ?? type} ready in Armoury!`, 'success');
    s.crafting.inProgress = null;

    // Refresh crafting screen if visible
    if (s.ui.currentScene === 'crafting') renderScreen(s);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  function renderScreen(s) {
    const container = document.getElementById('crafting-scene');
    if (!container) return;
    try {
      _renderScreenInner(s, container);
    } catch (err) {
      console.error('[Crafting] renderScreen crashed:', err);
      container.innerHTML = `<div class="cf-no-room"><div class="cf-no-room-title" style="color:var(--c-red-bright)">Workshop Error</div><p class="dim">${err.message}</p></div>`;
    }
  }

  function _renderScreenInner(s, container) {
    const hasWorkshop = s.rooms.some(r => r.type === 'workshop' && !r.constructing);

    if (!hasWorkshop) {
      container.innerHTML = `
        <div class="cf-no-room">
          <div class="cf-no-room-icon">🔧</div>
          <div class="cf-no-room-title">Workshop Required</div>
          <p class="dim">Build a Workshop in the Base screen to unlock the crafting system.</p>
          <button class="btn btn-olive" onclick="UI.navigateTo('home')">← Go to Base</button>
        </div>`;
      return;
    }

    const ip    = s.crafting.inProgress;
    const ipDef = ip ? ITEM_CATALOGUE[ip.type] : null;

    // ── Active job banner ─────────────────────────────────────────────────
    const jobBanner = ip && ipDef ? (() => {
      const total = ip.totalHours ?? ipDef.recipe.hours;
      const pct   = Math.round(((total - ip.hoursRemaining) / total) * 100);
      return `
        <div class="cf-job-banner">
          <div class="cf-job-left">
            <span class="cf-job-glyph">${ipDef.glyph}</span>
            <div>
              <div class="cf-job-label">Crafting: <strong>${ipDef.label}</strong></div>
              <div class="cf-job-meta dim">${ipDef.category} · Tier ${ipDef.tier}</div>
            </div>
          </div>
          <div class="cf-job-right">
            <span class="cf-job-hours dim">${ip.hoursRemaining}h remaining</span>
            <div class="cf-job-bar">
              <div class="cf-job-fill" style="width:${pct}%"></div>
            </div>
            <button class="btn btn-ghost cf-cancel" onclick="Crafting.cancelCraft()">Cancel</button>
          </div>
        </div>`;
    })() : `
      <div class="cf-job-banner cf-job-idle">
        <span class="cf-idle-dot"></span>
        <span class="dim">Workshop idle — select a recipe to begin.</span>
      </div>`;

    // ── Category filters ──────────────────────────────────────────────────
    const filters = CATEGORIES.map(c => `
      <button class="cf-filter ${_filterCat === c.key ? 'cf-filter-active' : ''}"
              onclick="Crafting.setFilter('${c.key}')">${c.glyph} ${c.label}</button>`
    ).join('');

    // ── Recipe list ───────────────────────────────────────────────────────
    const allItems    = _craftableItems()
      .filter(i => (i.recipe?.requiresResearch ?? []).every(r => s.research.researched.includes(r)));
    const filtered    = allItems.filter(i => _filterCat === 'all' || i.category === _filterCat);
    const inventoryCt = (type) => s.items.filter(i => i.type === type).length;

    const recipeCards = filtered.map(item => {
      const { craftable, reason } = canCraft(item.id, s);
      const hours   = effectiveHours(item.id, s);
      const inStock = inventoryCt(item.id);
      const isSel   = _selectedId === item.id;

      const costHtml = Object.entries(item.recipe.resources).map(([k, v]) => {
        const have = s.resources[k] ?? 0;
        return `<span class="cf-cost-pill ${have < v ? 'cf-cost-short' : ''}">${v} ${Resources.label(k)}</span>`;
      }).join('');

      const bonusHtml = Object.entries(item.statBonus).map(([k, v]) =>
        `<span class="cf-bonus-pill">+${v} ${k}</span>`
      ).join('');

      const reqs = (item.recipe.requiresResearch ?? []).map(r => {
        const met = s.research.researched.includes(r);
        return `<span class="cf-req-badge ${met ? 'cf-req-met' : 'cf-req-unmet'}">${RESEARCH_DEFS[r]?.label ?? r}</span>`;
      }).join('');

      return `
        <div class="cf-recipe ${isSel ? 'cf-recipe-selected' : ''} ${!craftable ? 'cf-recipe-locked' : ''}"
             onclick="Crafting.selectRecipe('${item.id}')">
          <div class="cf-recipe-header">
            <span class="cf-recipe-glyph">${item.glyph}</span>
            <div class="cf-recipe-meta">
              <span class="cf-recipe-name">${item.label}</span>
              <span class="cf-recipe-tier dim">T${item.tier} ${item.category}</span>
            </div>
            <div class="cf-recipe-right">
              ${inStock > 0 ? `<span class="cf-in-stock">×${inStock} owned</span>` : ''}
              <span class="cf-recipe-hours dim">${hours}h</span>
            </div>
          </div>

          ${isSel ? `
            <div class="cf-recipe-detail">
              <div class="cf-recipe-desc dim">${item.description}</div>
              <div class="cf-recipe-row">
                <div class="cf-recipe-costs">${costHtml}</div>
                <div class="cf-recipe-bonuses">${bonusHtml}</div>
              </div>
              ${reqs ? `<div class="cf-recipe-reqs">${reqs}</div>` : ''}
              ${craftable && !ip
                ? `<button class="btn btn-amber cf-craft-btn" onclick="event.stopPropagation(); Crafting.startCraft('${item.id}')">
                     🔧 Craft ${item.label} <span class="dim">(${hours}h)</span>
                   </button>`
                : ip
                  ? `<button class="btn cf-craft-btn" disabled>Workshop busy</button>`
                  : `<div class="cf-blocked dim">${reason}</div>`
              }
            </div>` : `
            <div class="cf-recipe-costs cf-costs-compact">${costHtml}</div>`
          }
        </div>`;
    }).join('') || `<div class="cf-empty dim">No items in this category yet.</div>`;

    // ── Inventory summary ─────────────────────────────────────────────────
    const ownedItems = s.items;
    const ownedSummary = ownedItems.length === 0
      ? '<span class="dim">No items crafted yet.</span>'
      : (() => {
          // Group by type
          const counts = {};
          ownedItems.forEach(i => { counts[i.type] = (counts[i.type] ?? 0) + 1; });
          return Object.entries(counts).map(([type, count]) => {
            const def = ITEM_CATALOGUE[type];
            const assigned = ownedItems.filter(i => i.type === type && i.assignedTo).length;
            return `
              <div class="cf-inv-row">
                <span class="cf-inv-glyph">${def?.glyph ?? '?'}</span>
                <span class="cf-inv-name">${def?.label ?? type}</span>
                <span class="cf-inv-count dim">×${count}</span>
                ${assigned > 0 ? `<span class="cf-inv-assigned olive">${assigned} equipped</span>` : ''}
              </div>`;
          }).join('');
        })();

    container.innerHTML = `
      <div class="cf-layout">
        <div class="cf-header">
          <div>
            <div class="cf-title">Workshop — Crafting</div>
            <div class="dim" style="font-size:14px">${s.items.length} item${s.items.length !== 1 ? 's' : ''} in inventory · Assign in the <button class="cf-link-btn" onclick="UI.navigateTo('personnel')">Personnel</button></div>
          </div>
          <div class="cf-filters">${filters}</div>
        </div>

        ${jobBanner}

        <div class="cf-main">
          <div class="cf-recipes">
            <div class="cf-sec-label">Recipes</div>
            ${recipeCards}
          </div>
          <div class="cf-sidebar">
            <div class="cf-sec-label">Current Inventory</div>
            <div class="cf-inv-list">${ownedSummary}</div>
            <button class="btn btn-ghost cf-armoury-btn" onclick="UI.navigateTo('personnel')">
              Open Armoury →
            </button>
          </div>
        </div>
      </div>`;
  }

  // ── UI handlers ───────────────────────────────────────────────────────────

  function setFilter(cat) {
    _filterCat = cat;
    _selectedId = null;
    if (State.isReady()) renderScreen(State.get());
  }

  function selectRecipe(id) {
    _selectedId = _selectedId === id ? null : id;
    if (State.isReady()) renderScreen(State.get());
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    renderScreen,
    startCraft,
    cancelCraft,
    onComplete,
    effectiveHours,
    canCraft,
    setFilter,
    selectRecipe,
  };

})();
