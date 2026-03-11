/**
 * STARGATE: REMNANTS — Gate
 * Full Stargate dialing console, wormhole management, planet detail screen,
 * team deployment, and return gate logic.
 *
 * Sub-screens:
 *   'dhd'      → DHD dialing console with 39 symbols
 *   'planet'   → Arrived at planet — biome art, lore, mission list
 *   'dialing'  → Animated sequence (chevrons locking)
 */

const Gate = (() => {

  // ── Internal state ────────────────────────────────────────────────────────

  let _subScreen        = 'dhd';    // 'dhd' | 'team-select' | 'planet' | 'dialing'
  let _dialingTimer     = null;
  let _chevronIndex     = 0;
  let _pendingAddress   = [];       // address being dialed symbol by symbol
  let _currentWorldId   = null;     // world currently connected / visited
  let _gateTeamSelected = [];       // personnel IDs chosen for gate traversal
  let _isDialing        = false;    // true while ring spin animation is in progress

  const $ = id => document.getElementById(id);

  // ── Main render ────────────────────────────────────────────────────────────

  function renderScreen(s) {
    const container = $('gate-scene');
    if (!container) return;

    if (s.offWorld) {
      _currentWorldId = s.offWorld.worldId;
      // Only auto-switch to planet if we're not mid-team-selection
      if (_subScreen !== 'team-select') {
        _subScreen = 'planet';
      }
    }

    // If we're showing a decoding world view, delegate to Decoding module
    if (_decodingWorldId) {
      Decoding.renderScreen(s, container);
      return;
    }

    if (_subScreen === 'dhd') {
      _renderDHD(s, container);
    } else if (_subScreen === 'team-select') {
      _renderTeamSelect(s, container);
    } else if (_subScreen === 'planet') {
      _renderPlanet(s, container);
    }
  }

  // ── DHD Console ──────────────────────────────────────────────────────────

  function _renderDHD(s, container) {
    const dialed   = s.dialedAddress || [];
    const hasDials = dialed.length > 0;
    const knownWorlds = s.worlds.filter(w => w.decoded);
    const isActive = Wormhole.getState() === 'active';

    // Get the symbol objects for the dialed address
    const dialedSymbols = dialed.map(name => SYMBOLS.find(sym => sym.name === name)).filter(Boolean);

    container.innerHTML = `
      <div class="gate-layout">

        <!-- LEFT: Gate ring + wormhole -->
        <div class="gate-visual-col">
          <div id="wormhole-container"></div>
          <div class="gate-status-bar">
            ${isActive
              ? `<span class="gate-status-active">◉ WORMHOLE ACTIVE</span>`
              : hasDials
                ? `<span class="gate-status-dialing">◌ DIALING — ${dialed.length}/6 symbols</span>`
                : `<span class="gate-status-idle dim">○ GATE INACTIVE</span>`}
          </div>
        </div>

        <!-- RIGHT: DHD pad + controls -->
        <div class="gate-control-col">

          <!-- Address display strip -->
          <div class="address-display">
            <div class="address-title dim">Dialing Sequence</div>
            <div class="address-symbols">
              ${[0,1,2,3,4,5].map(i => {
                const sym = dialedSymbols[i];
                return `<div class="addr-slot ${sym ? 'filled' : ''} ${i === dialed.length && !isActive ? 'active-slot' : ''}">
                  ${sym ? `<span class="addr-glyph">${sym.glyph}</span><span class="addr-name">${sym.name}</span>` : '<span class="addr-empty">○</span>'}
                </div>`;
              }).join('')}
              <!-- Point of Origin (always symbol 7, auto-appended) -->
              <div class="addr-slot addr-origin ${dialed.length === 6 ? 'filled' : ''}">
                <span class="addr-glyph">⊕</span>
                <span class="addr-name">origin</span>
              </div>
            </div>
            <div class="address-actions">
              ${dialed.length === 6 && !isActive
                ? `<button class="btn btn-amber dhd-engage-btn" onclick="Gate.engageWormhole()">◎ Engage</button>`
                : ''}
              ${dialed.length > 0 && !isActive
                ? `<button class="btn btn-ghost" onclick="Gate.clearAddress()" style="margin-left:8px">✕ Clear</button>`
                : ''}
              ${isActive
                ? `<button class="btn btn-red" onclick="Gate.closeWormhole()">✕ Close Wormhole</button>`
                : ''}
            </div>
          </div>

          <!-- DHD Glyph Pad -->
          ${!isActive ? `
          <div class="dhd-pad">
            <div class="dhd-title dim">DHD — Select Symbol</div>
            ${_buildDHDPad(dialed)}
          </div>` : `
          <div class="dhd-pad-inactive dim" style="padding:16px;text-align:center">
            Wormhole active. Dialing locked.
          </div>`}

          <!-- Known addresses speed-dial -->
          <div class="speedial-panel">
            <div class="speedial-title dim">Known Addresses</div>
            ${knownWorlds.length === 0
              ? '<p class="dim" style="font-size:14px">No decoded gate addresses.</p>'
              : knownWorlds.map(w => {
                  const def = planetById(w.id);
                  const biomeClass = def ? `biome-${def.biome}` : '';
                  return `
                    <div class="speeddial-entry ${biomeClass}" onclick="Gate.speedDial('${w.id}')">
                      <span class="speeddial-name">${w.name}</span>
                      <span class="speeddial-addr dim">${def?.address?.map(n => SYMBOLS.find(s=>s.name===n)?.glyph ?? '?').join(' ') ?? '?'}</span>
                      <span class="speeddial-biome dim">${def?.biome ?? ''}</span>
                    </div>`;
                }).join('')}
          </div>

          <!-- Unknown addresses — decode panel -->
          <div class="speedial-panel speedial-unknown-panel">
            <div class="speedial-title dim">Unknown Addresses</div>
            ${_renderUnknownList(s)}
          </div>

          ${s.ui.devMode ? `
          <div class="speedial-panel" style="border-color:var(--c-amber-dim)">
            <div class="speedial-title" style="color:var(--c-amber)">⚙ Dev Mode</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:4px">
              <button class="btn btn-amber" style="font-size:12px" onclick="Gate.devUnlockAllGates()">Unlock All Gates</button>
              <button class="btn btn-amber" style="font-size:12px" onclick="Gate.devAddResources()">+999 All Resources</button>
            </div>
          </div>` : ''}

        </div>
      </div>`;

    // Mount the wormhole SVG into its container
    Wormhole.render('wormhole-container');

    // Mark already-dialed symbols on the gate ring
    dialed.forEach(name => {
      const el = document.querySelector(`.gate-symbol[data-symbol="${name}"]`);
      if (el) el.classList.add('symbol-dialed');
    });

    // Restore chevron states if we dialed some (skip during spin sequence)
    if (!_isDialing) {
      dialed.forEach((_, i) => Wormhole.lockChevron(i + 1));
    }
    if (isActive) {
      for (let i = 1; i <= 7; i++) Wormhole.lockChevron(i);
      Wormhole.engage();
    }
  }

  // ── Unknown addresses list (decoding panel embedded in gate) ───────────────

  function _renderUnknownList(s) {
    Decoding.ensureState(s);
    const locked = PLANET_DB.filter(d => !d.decoded);
    if (!locked.length) return '<p class="dim" style="font-size:14px">All addresses decoded.</p>';

    const ADDR_STATES = { unknown: 'unknown', rumoured: 'rumoured', hinted: 'hinted', fragment: 'fragment', decoded: 'decoded' };

    return locked.map(def => {
      const rec = s.decoding[def.id] ?? { state: 'unknown', knownSymbols: [] };
      const pct = Math.round(rec.knownSymbols.length / 6 * 100);
      const symHtml = def.address.map(sym => {
        const known = rec.knownSymbols.includes(sym);
        const g = SYMBOLS.find(x => x.name === sym)?.glyph ?? '?';
        return `<span class="unk-sym ${known ? 'unk-sym-known' : ''}" title="${known ? sym : '?'}">${known ? g : '░'}</span>`;
      }).join('') + '<span class="unk-sym unk-sym-origin" title="origin">⊕</span>';

      const label = rec.state === 'unknown'   ? '? Unknown'
                  : rec.state === 'rumoured'  ? '◎ Rumoured'
                  : rec.state === 'hinted'    ? '◑ Hinted'
                  : rec.state === 'fragment'  ? '◕ Fragment'
                  : '● Decoded';

      return `
        <div class="unk-entry" onclick="Gate.openAddressDecode('${def.id}')">
          <div class="unk-entry-top">
            <span class="unk-name">${rec.state === 'unknown' ? '??? — Unknown World' : def.name}</span>
            <span class="unk-state-badge unk-state-${rec.state}">${label}</span>
          </div>
          <div class="unk-syms">${symHtml}</div>
          <div class="unk-prog"><div class="unk-prog-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join('');
  }

  // ── Decoding world view embedded in gate scene ──────────────────────────────

  let _decodingWorldId = null; // non-null when showing decoding overlay in gate

  function openAddressDecode(worldId) {
    _decodingWorldId = worldId;
    Decoding.openWorld(worldId);
    if (State.isReady()) {
      const container = $('gate-scene');
      if (container) Decoding.renderScreen(State.get(), container);
    }
  }

  function closeAddressDecode() {
    _decodingWorldId = null;
    Decoding.backToIndex();
    _subScreen = 'dhd';
    if (State.isReady()) renderScreen(State.get());
  }

  function _buildDHDPad(dialed) {
    const dialable = dialableSymbols(); // 38 non-origin symbols
    const origin   = SYMBOLS[38];

    // Circular layout: 3 concentric rings around central origin button.
    // Glyph-only buttons (no text label) — hover title shows name, matching the show's DHD.
    // Container 380×380, centre at (190, 190).
    const SIZE = 380;
    const CX   = SIZE / 2;   // 190
    const CY   = SIZE / 2;   // 190
    const HALF = 18;          // half of 36px button

    const rings = [
      { count: 8,  radius: 64  },
      { count: 14, radius: 118 },
      { count: 16, radius: 170 },
    ];

    let si = 0;
    const btnHtml = rings.map(ring => {
      const out = [];
      for (let i = 0; i < ring.count && si < dialable.length; i++, si++) {
        const sym   = dialable[si];
        const angle = (i / ring.count) * 2 * Math.PI - Math.PI / 2; // start from top
        const x     = (CX + ring.radius * Math.cos(angle) - HALF).toFixed(1);
        const y     = (CY + ring.radius * Math.sin(angle) - HALF).toFixed(1);
        const used  = dialed.includes(sym.name);
        out.push(`
          <button class="dhd-btn ${used ? 'dhd-btn-used' : ''}"
                  style="left:${x}px;top:${y}px"
                  data-symbol="${sym.name}"
                  ${used || dialed.length >= 6 ? 'disabled' : ''}
                  onclick="Gate.dialSymbol('${sym.name}')"
                  title="${sym.name}">
            <span class="dhd-glyph">${sym.glyph}</span>
          </button>`);
      }
      return out.join('');
    }).join('');

    // Centre origin button — becomes Engage when 6 symbols dialed
    const CSIZE = 56;
    const cx    = (CX - CSIZE / 2).toFixed(1);
    const cy    = (CY - CSIZE / 2).toFixed(1);
    const centreBtn = dialed.length === 6
      ? `<button class="dhd-centre-btn dhd-centre-ready"
                 style="left:${cx}px;top:${cy}px"
                 onclick="Gate.engageWormhole()" title="Engage — Point of Origin">
           <span class="dhd-glyph">${origin.glyph}</span>
           <span class="dhd-centre-label">ENGAGE</span>
         </button>`
      : `<div class="dhd-centre-btn dhd-centre-idle"
               style="left:${cx}px;top:${cy}px"
               title="Point of Origin">
           <span class="dhd-glyph dim">${origin.glyph}</span>
         </div>`;

    return `<div class="dhd-circle-wrap" style="width:${SIZE}px;height:${SIZE}px">${btnHtml}${centreBtn}</div>`;
  }

  // ── Gate team selection screen ─────────────────────────────────────────────

  function _renderTeamSelect(s, container) {
    const def        = planetById(_currentWorldId);
    const worldState = s.worlds.find(w => w.id === _currentWorldId);
    const name       = worldState?.name ?? def?.name ?? 'Unknown World';

    const memberCards = s.personnel.map(p => {
      if (!p.alive) return '';
      const inTeam  = _gateTeamSelected.includes(p.id);
      const busy    = !!(p.offWorld || p.training || p.healing);
      const arch    = Personnel.ARCHETYPES[p.archetype] ?? Personnel.ARCHETYPES.balanced;
      const eff     = Personnel.effectiveStats(p, s);
      const reason  = p.offWorld ? 'On mission' : p.training ? 'In training' : p.healing ? 'In med bay' : '';
      const clickFn = busy ? '' : `Gate.toggleGateTeamMember('${p.id}')`;
      return `
        <div class="team-member-card ${inTeam ? 'in-team' : ''} ${busy ? 'unavailable' : ''}"
             onclick="${clickFn}" title="${reason || p.name}">
          <span class="arch-glyph">${arch.callout}</span>
          <div class="member-info">
            <div class="member-name">${p.name}</div>
            <div class="member-stats dim">
              ⚔${eff.combat} · 🤝${eff.diplomacy} · 🔬${eff.science} · 🌿${eff.survival}
              &nbsp;<span class="dim hp-inline">${p.health}hp</span>
            </div>
          </div>
          ${inTeam  ? '<span class="in-team-badge">✓</span>' : ''}
          ${busy    ? `<span class="unavail-badge dim" title="${reason}">—</span>` : ''}
        </div>`;
    }).join('');

    const canConfirm = _gateTeamSelected.length > 0;

    container.innerHTML = `
      <div class="gate-team-select">

        <div class="gate-team-select-header">
          <div class="gate-team-select-title">${name}</div>
          <div class="gate-team-select-sub dim">Wormhole stable. Select up to ${CONFIG.MAX_TEAM_SIZE} personnel to step through.</div>
        </div>

        <div class="team-member-list gate-team-list">
          ${memberCards || '<p class="dim" style="padding:16px">No personnel available.</p>'}
        </div>

        <div class="gate-team-select-footer">
          <span class="prob-display dim">${_gateTeamSelected.length} / ${CONFIG.MAX_TEAM_SIZE} selected</span>
          <div style="display:flex;gap:var(--sp-3)">
            <button class="btn btn-ghost" onclick="Gate.closeWormhole()">✕ Abort</button>
            <button class="btn btn-amber"
                    ${canConfirm ? '' : 'disabled'}
                    onclick="Gate.confirmGateTeam()">
              ◎ Step Through Gate
            </button>
          </div>
        </div>

      </div>`;
  }

  function toggleGateTeamMember(id) {
    if (!State.isReady()) return;
    const s = State.get();
    const p = s.personnel.find(x => x.id === id);
    if (!p || !p.alive || p.offWorld || p.training || p.healing) return;

    if (_gateTeamSelected.includes(id)) {
      _gateTeamSelected = _gateTeamSelected.filter(x => x !== id);
    } else {
      if (_gateTeamSelected.length >= CONFIG.MAX_TEAM_SIZE) {
        UI.showNotification(`Max ${CONFIG.MAX_TEAM_SIZE} personnel can go off-world.`, 'warn');
        return;
      }
      _gateTeamSelected.push(id);
    }
    renderScreen(s);
  }

  function confirmGateTeam() {
    if (!State.isReady() || _gateTeamSelected.length === 0) return;
    const s = State.get();

    s.offWorld.team = [..._gateTeamSelected];
    Engine.log('info', `Gate team stepping through: ${_gateTeamSelected.map(id => s.personnel.find(p => p.id === id)?.name ?? id).join(', ')}.`);

    _playTransit(() => {
      _subScreen      = 'planet';
      _currentWorldId = s.offWorld.worldId;
      // Pick 4 random missions for this visit and init per-trip tracking
      const def = planetById(_currentWorldId);
      if (def?.missions?.length > 0) {
        const pool = [...def.missions];
        const pick = [];
        while (pick.length < Math.min(4, pool.length)) {
          const i = Math.floor(Math.random() * pool.length);
          pick.push(pool.splice(i, 1)[0]);
        }
        s.offWorld.activeMissions    = pick;
      }
      s.offWorld.completedMissions = [];
      s.offWorld.usedPersonnel     = [];
      UI.syncNav();
      renderScreen(s);
    });
  }

  // ── Planet screen ──────────────────────────────────────────────────────────

  function _renderPlanet(s, container) {
    const worldState  = s.worlds.find(w => w.id === _currentWorldId);
    const def         = planetById(_currentWorldId);

    if (!worldState || !def) {
      container.innerHTML = `<p class="dim">Unknown world.</p>`;
      return;
    }

    const threatColors = {
      low:       '#7a8c3a',
      medium:    '#c8832a',
      high:      '#b03020',
      very_high: '#d04030',
    };
    const threatColor = threatColors[def.threat] ?? '#c8c4b0';

    container.innerHTML = `
      <div class="planet-layout">

        <!-- Planet header -->
        <div class="planet-header ${def.biome}-header">
          <div class="planet-biome-art">
            ${_biomeSVG(def.biome)}
          </div>
          <div class="planet-title-block">
            <div class="planet-designation">${worldState.name}</div>
            <div class="planet-desc">${def.description}</div>
            <div class="planet-meta-row">
              <span class="planet-meta-badge" style="color:${threatColor}">
                ⚠ ${def.threat.replace('_', ' ')} threat
              </span>
              <span class="planet-meta-badge">🌍 ${def.biome}</span>
              <span class="planet-meta-badge dim">🔴 ${def.atmosphere}</span>
            </div>
          </div>
        </div>

        <!-- Lore block -->
        <div class="planet-lore-bar">
          <span class="dim" style="font-size:14px">INTEL</span>
          <span class="planet-lore-text">${def.lore}</span>
        </div>

        <!-- Resource potential -->
        <div class="planet-resources">
          <div class="panel-sub-title">Resource Potential</div>
          <div class="planet-resource-list">
            ${Object.entries(def.resources).map(([res, cfg]) =>
              `<div class="planet-resource-row">
                <span>${res}</span>
                <div class="res-chance-bar">
                  <div class="res-chance-fill" style="width:${Math.round(cfg.chance * 100)}%"></div>
                </div>
                <span class="dim">${cfg.amount[0]}–${cfg.amount[1]}</span>
              </div>`
            ).join('')}
          </div>
        </div>

        <!-- Mission panel -->
        <div class="planet-missions">
          <div id="gate-mission-panel"></div>
        </div>

        <!-- Debrief overlay -->
        <div id="gate-debrief"></div>

        <!-- Return gate button -->
        <div class="planet-return-bar">
          <button class="btn btn-red return-gate-btn" onclick="Gate.returnToBase()">
            Return Home
          </button>
        </div>

      </div>`;

    // Mount mission panel
    Missions.renderMissionPanel(s, _currentWorldId);
  }

  // ── Biome SVG art ─────────────────────────────────────────────────────────

  function _biomeSVG(biome) {
    const arts = {
      plains: `
        <svg viewBox="0 0 280 120" class="biome-svg">
          <defs>
            <linearGradient id="sky-plains" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#1a2810"/>
              <stop offset="100%" stop-color="#3a4820"/>
            </linearGradient>
          </defs>
          <rect width="280" height="120" fill="url(#sky-plains)"/>
          <!-- horizon ground -->
          <path d="M0 85 Q70 78 140 82 Q210 86 280 80 L280 120 L0 120Z" fill="#2a3818"/>
          <!-- ruins columns -->
          <rect x="40" y="50" width="8" height="38" fill="#4a5830" opacity="0.8"/>
          <rect x="60" y="42" width="8" height="46" fill="#4a5830" opacity="0.9"/>
          <rect x="80" y="55" width="6" height="32" fill="#3a4820" opacity="0.7"/>
          <rect x="160" y="48" width="10" height="40" fill="#4a5830"/>
          <rect x="185" y="38" width="8" height="50" fill="#4a5830" opacity="0.85"/>
          <!-- distant hill -->
          <ellipse cx="230" cy="80" rx="50" ry="18" fill="#222e14" opacity="0.6"/>
          <!-- stars/dust -->
          <circle cx="20" cy="15" r="1" fill="#c8c4b0" opacity="0.5"/>
          <circle cx="120" cy="8" r="0.8" fill="#c8c4b0" opacity="0.4"/>
          <circle cx="200" cy="20" r="1.2" fill="#c8c4b0" opacity="0.6"/>
          <circle cx="255" cy="12" r="0.7" fill="#c8c4b0" opacity="0.3"/>
        </svg>`,
      ice: `
        <svg viewBox="0 0 280 120" class="biome-svg">
          <defs>
            <linearGradient id="sky-ice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0a1428"/>
              <stop offset="100%" stop-color="#1a2840"/>
            </linearGradient>
          </defs>
          <rect width="280" height="120" fill="url(#sky-ice)"/>
          <!-- frozen sea -->
          <path d="M0 75 Q140 68 280 73 L280 120 L0 120Z" fill="#1e3450"/>
          <!-- ice formations -->
          <polygon points="30,75 45,35 60,75" fill="#2a4868" opacity="0.9"/>
          <polygon points="55,75 75,20 95,75" fill="#3a5878" opacity="0.85"/>
          <polygon points="180,75 200,28 220,75" fill="#2a4868" opacity="0.9"/>
          <polygon points="210,75 230,45 250,75" fill="#3a5878" opacity="0.7"/>
          <!-- aurora effect -->
          <path d="M0 30 Q70 10 140 25 Q210 40 280 15" stroke="#2a7a5a" stroke-width="3" fill="none" opacity="0.4"/>
          <path d="M0 40 Q70 20 140 35 Q210 50 280 25" stroke="#3a9a6a" stroke-width="2" fill="none" opacity="0.3"/>
          <!-- ice crystals ground sparkle -->
          <circle cx="100" cy="78" r="1.5" fill="#8ad8f8" opacity="0.7"/>
          <circle cx="150" cy="74" r="1" fill="#8ad8f8" opacity="0.5"/>
          <circle cx="170" cy="80" r="1.5" fill="#a0e0ff" opacity="0.6"/>
        </svg>`,
      jungle: `
        <svg viewBox="0 0 280 120" class="biome-svg">
          <defs>
            <linearGradient id="sky-jungle" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0a1408"/>
              <stop offset="100%" stop-color="#1a2a10"/>
            </linearGradient>
          </defs>
          <rect width="280" height="120" fill="url(#sky-jungle)"/>
          <!-- canopy layers -->
          <ellipse cx="30"  cy="90" rx="40" ry="30" fill="#1a3010"/>
          <ellipse cx="80"  cy="85" rx="55" ry="38" fill="#243818"/>
          <ellipse cx="150" cy="80" rx="60" ry="42" fill="#1a3010"/>
          <ellipse cx="220" cy="83" rx="55" ry="36" fill="#243818"/>
          <ellipse cx="265" cy="88" rx="40" ry="30" fill="#1a3010"/>
          <!-- second tier, brighter -->
          <ellipse cx="50"  cy="82" rx="35" ry="22" fill="#2e4a20"/>
          <ellipse cx="140" cy="75" rx="45" ry="28" fill="#2e4a20"/>
          <ellipse cx="230" cy="78" rx="40" ry="24" fill="#2e4a20"/>
          <!-- bioluminescent dots -->
          <circle cx="70"  cy="88" r="2" fill="#4a9a50" opacity="0.7"/>
          <circle cx="120" cy="82" r="1.5" fill="#6aaa60" opacity="0.6"/>
          <circle cx="190" cy="85" r="2" fill="#4a9a50" opacity="0.8"/>
          <circle cx="240" cy="80" r="1.5" fill="#8aca70" opacity="0.5"/>
          <!-- misty ground -->
          <path d="M0 105 Q140 100 280 105 L280 120 L0 120Z" fill="#0a1a08" opacity="0.8"/>
        </svg>`,
      desert: `
        <svg viewBox="0 0 280 120" class="biome-svg">
          <defs>
            <linearGradient id="sky-desert" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#301808"/>
              <stop offset="100%" stop-color="#502808"/>
            </linearGradient>
          </defs>
          <rect width="280" height="120" fill="url(#sky-desert)"/>
          <!-- sand dunes -->
          <path d="M0 85 Q50 70 100 80 Q150 90 200 72 Q240 58 280 75 L280 120 L0 120Z" fill="#6a3818"/>
          <path d="M0 100 Q80 88 160 95 Q220 100 280 90 L280 120 L0 120Z" fill="#7a4820"/>
          <!-- mesas -->
          <rect x="20"  y="60" width="35" height="28" rx="2" fill="#5a2810"/>
          <rect x="18"  y="58" width="39" height="6"  rx="1" fill="#6a3010"/>
          <rect x="190" y="50" width="45" height="35" rx="2" fill="#5a2810"/>
          <rect x="188" y="48" width="49" height="6"  rx="1" fill="#6a3010"/>
          <!-- dust haze -->
          <rect width="280" height="120" fill="#c87830" opacity="0.05"/>
          <!-- distant structure -->
          <rect x="130" y="68" width="5" height="15" fill="#4a2008" opacity="0.8"/>
          <rect x="140" y="62" width="5" height="21" fill="#4a2008" opacity="0.9"/>
        </svg>`,
      inhabited: `
        <svg viewBox="0 0 280 120" class="biome-svg">
          <defs>
            <linearGradient id="sky-inh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#101820"/>
              <stop offset="100%" stop-color="#202830"/>
            </linearGradient>
          </defs>
          <rect width="280" height="120" fill="url(#sky-inh)"/>
          <!-- fields -->
          <path d="M0 80 Q140 72 280 78 L280 120 L0 120Z" fill="#253820"/>
          <!-- settlement buildings -->
          <rect x="50"  y="62" width="18" height="22" fill="#3a4830"/>
          <polygon points="41,62 68,62 59,48" fill="#4a5838"/>
          <rect x="90"  y="55" width="22" height="28" fill="#3a4830"/>
          <polygon points="82,55 120,55 110,38" fill="#4a5838"/>
          <rect x="140" y="65" width="15" height="18" fill="#3a4830"/>
          <rect x="170" y="58" width="25" height="25" fill="#3a4830"/>
          <polygon points="162,58 203,58 192,42" fill="#4a5838"/>
          <!-- warm lights -->
          <rect x="55"  y="70" width="5" height="6"  fill="#c88020" opacity="0.8"/>
          <rect x="96"  y="65" width="6" height="7"  fill="#c88020" opacity="0.7"/>
          <rect x="175" y="68" width="5" height="6"  fill="#c88020" opacity="0.9"/>
          <!-- sky stars -->
          <circle cx="30"  cy="15" r="1"   fill="#c8c4b0" opacity="0.6"/>
          <circle cx="100" cy="8"  r="0.8" fill="#c8c4b0" opacity="0.5"/>
          <circle cx="200" cy="20" r="1.2" fill="#c8c4b0" opacity="0.4"/>
        </svg>`,
      volcanic: `
        <svg viewBox="0 0 280 120" class="biome-svg">
          <defs>
            <linearGradient id="sky-volc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#200808"/>
              <stop offset="100%" stop-color="#401010"/>
            </linearGradient>
            <linearGradient id="lava" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#b04020"/>
              <stop offset="50%" stop-color="#e08030"/>
              <stop offset="100%" stop-color="#b04020"/>
            </linearGradient>
          </defs>
          <rect width="280" height="120" fill="url(#sky-volc)"/>
          <!-- lava rivers -->
          <path d="M0 95 Q60 88 100 92 Q140 96 180 88 Q220 80 280 90 L280 120 L0 120Z" fill="#3a0808"/>
          <path d="M20 108 Q80 100 140 105 Q200 110 260 103 L280 108 L280 120 L0 120Z" fill="url(#lava)" opacity="0.6"/>
          <!-- volcano silhouette -->
          <polygon points="100,80 140,10 180,80" fill="#280808"/>
          <!-- crater glow -->
          <ellipse cx="140" cy="15" rx="12" ry="6" fill="#e08030" opacity="0.6"/>
          <!-- smoke puffs -->
          <ellipse cx="138" cy="5" rx="8" ry="4" fill="#3a1808" opacity="0.5"/>
          <ellipse cx="145" cy="-2" rx="6" ry="3" fill="#3a1808" opacity="0.4"/>
          <!-- lava geyser glow on ground -->
          <circle cx="50"  cy="90" r="6" fill="#e08030" opacity="0.4"/>
          <circle cx="230" cy="85" r="8" fill="#e08030" opacity="0.3"/>
        </svg>`,
      ancient_outpost: `
        <svg viewBox="0 0 280 120" class="biome-svg">
          <defs>
            <linearGradient id="sky-anc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#080810"/>
              <stop offset="100%" stop-color="#101020"/>
            </linearGradient>
          </defs>
          <rect width="280" height="120" fill="url(#sky-anc)"/>
          <!-- white stone ground -->
          <path d="M0 85 Q140 80 280 85 L280 120 L0 120Z" fill="#1a1a28"/>
          <!-- Ancient architecture arches -->
          <path d="M40 85 Q40 45 60 45 Q80 45 80 85" stroke="#4a4a78" stroke-width="2.5" fill="none"/>
          <path d="M90 85 Q90 35 115 35 Q140 35 140 85" stroke="#5a5a88" stroke-width="3" fill="none"/>
          <path d="M150 85 Q150 45 170 45 Q190 45 190 85" stroke="#4a4a78" stroke-width="2.5" fill="none"/>
          <path d="M200 85 Q200 55 215 55 Q230 55 230 85" stroke="#3a3a68" stroke-width="2" fill="none"/>
          <!-- glowing script on ground -->
          <rect x="60" y="88" width="160" height="2" fill="#7a7aaa" opacity="0.5"/>
          <!-- ambient light pillars -->
          <rect x="57" y="45" width="3" height="40" fill="#8888cc" opacity="0.2"/>
          <rect x="112" y="35" width="4" height="50" fill="#8888cc" opacity="0.25"/>
          <rect x="168" y="45" width="3" height="40" fill="#8888cc" opacity="0.2"/>
          <!-- stars overhead -->
          <circle cx="50"  cy="15" r="1.5" fill="#9090d8" opacity="0.8"/>
          <circle cx="120" cy="8"  r="1"   fill="#9090d8" opacity="0.6"/>
          <circle cx="200" cy="20" r="1.5" fill="#9090d8" opacity="0.7"/>
          <circle cx="250" cy="10" r="1"   fill="#9090d8" opacity="0.5"/>
        </svg>`,
      moon: `
        <svg viewBox="0 0 280 120" class="biome-svg">
          <defs>
            <radialGradient id="gasgiant" cx="0.5" cy="1.2" r="1">
              <stop offset="0%" stop-color="#c88030"/>
              <stop offset="40%" stop-color="#8050a0"/>
              <stop offset="100%" stop-color="#101020"/>
            </radialGradient>
          </defs>
          <rect width="280" height="120" fill="#060610"/>
          <!-- Gas giant dominates upper sky -->
          <ellipse cx="200" cy="-20" rx="130" ry="100" fill="url(#gasgiant)" opacity="0.5"/>
          <!-- Gas giant bands -->
          <path d="M90 20 Q160 30 280 18" stroke="#a06020" stroke-width="3" fill="none" opacity="0.2"/>
          <path d="M75 35 Q160 45 280 30" stroke="#806080" stroke-width="2" fill="none" opacity="0.15"/>
          <!-- Moon surface -->
          <path d="M0 88 Q70 82 140 86 Q210 90 280 84 L280 120 L0 120Z" fill="#1a1818"/>
          <!-- fortress ruins on plateau -->
          <rect x="80"  y="65" width="120" height="28" fill="#1a1818"/>
          <rect x="85"  y="55" width="20"  height="38" fill="#222022"/>
          <rect x="115" y="50" width="15"  height="43" fill="#222022"/>
          <rect x="155" y="55" width="20"  height="38" fill="#222022"/>
          <rect x="175" y="60" width="15"  height="33" fill="#1e1c1e"/>
          <!-- eerie light from fortress -->
          <rect x="90"  y="70" width="5"   height="8"  fill="#3a3880" opacity="0.6"/>
          <rect x="118" y="65" width="4"   height="6"  fill="#3a3880" opacity="0.5"/>
        </svg>`,
    };

    return arts[biome] ?? arts['plains'];
  }

  // ── Dialing mechanics ─────────────────────────────────────────────────────

  function dialSymbol(symbolName) {
    if (!State.isReady()) return;
    const s = State.get();

    if (Wormhole.getState() !== 'idle') return;
    if (_isDialing) return;
    if (s.dialedAddress.length >= 6)    return;
    if (s.dialedAddress.includes(symbolName)) {
      UI.showNotification('Symbol already in sequence.', 'warn');
      return;
    }

    s.dialedAddress.push(symbolName);
    const chevronIdx = s.dialedAddress.length;

    // Render first so the address strip updates and the ring snaps to its
    // current saved angle (Wormhole.render() handles this after rebuilding HTML).
    _isDialing = true;
    renderScreen(s);

    // Spin ring to bring the dialed symbol to the top encoding position,
    // then lock the next chevron.
    Wormhole.spinToSymbol(symbolName, () => {
      _isDialing = false;
      Wormhole.lockChevron(chevronIdx);
      // Highlight the symbol on the ring after it arrives at top
      const symEl = document.querySelector(`.gate-symbol[data-symbol="${symbolName}"]`);
      if (symEl) symEl.classList.add('symbol-dialed');
    });
  }

  function clearAddress() {
    if (!State.isReady()) return;
    const s = State.get();
    _isDialing = false;
    s.dialedAddress = [];
    Wormhole.resetChevrons();
    renderScreen(s);
  }

  function speedDial(worldId) {
    if (!State.isReady()) return;
    const s   = State.get();
    const def = planetById(worldId);
    if (!def) return;
    if (_isDialing) return;

    const fullAddress = [...def.address.slice(0, 6)];
    s.dialedAddress   = [];
    _isDialing        = true;

    // Start from a clean ring position
    Wormhole.resetChevrons();
    renderScreen(s); // empty address strip, ring at 0

    UI.showNotification(`Speed dialing ${def.name}…`, 'info');

    // Spin each symbol in sequence (fast mode)
    let i = 0;
    function dialNext() {
      if (i >= fullAddress.length) {
        _isDialing = false;
        renderScreen(s); // final render with full address + locked chevrons
        return;
      }
      const symName    = fullAddress[i];
      const chevronIdx = i + 1;
      i++;

      s.dialedAddress.push(symName);
      renderScreen(s); // show symbol appearing in address strip

      Wormhole.spinToSymbol(symName, () => {
        Wormhole.lockChevron(chevronIdx);
        const symEl = document.querySelector(`.gate-symbol[data-symbol="${symName}"]`);
        if (symEl) symEl.classList.add('symbol-dialed');
        setTimeout(dialNext, 120); // brief pause between symbols
      }, true /* fast */);
    }
    dialNext();
  }

  function engageWormhole() {
    if (!State.isReady()) return;
    const s = State.get();

    if (s.dialedAddress.length !== 6) {
      UI.showNotification('Address incomplete — 6 symbols required.', 'warn');
      return;
    }
    if (Wormhole.getState() !== 'idle') return;

    // Find matching planet
    const def = planetByAddress(s.dialedAddress);

    // Lock 7th chevron (point of origin)
    Wormhole.lockChevron(7);

    // Kawoosh!
    Wormhole.engage(() => {
      // After wormhole stabilises
      if (def) {
        _currentWorldId   = def.id;
        _gateTeamSelected = [];
        _subScreen        = 'team-select';

        // Ensure world exists in state
        if (!s.worlds.find(w => w.id === def.id)) {
          s.worlds.push({
            id:      def.id,
            name:    def.name,
            address: def.address,
            decoded: true,
            visited: false,
            biome:   def.biome,
          });
        }
        const world = s.worlds.find(w => w.id === def.id);
        if (world) world.visited = true;

        s.offWorld = { worldId: def.id, team: [], missions: [] };
        Engine.log('benefit', `Wormhole established. Destination: ${def.name} (${def.biome}). Select team to step through.`);
        renderScreen(s);
      } else {
        // Unknown address — gate kawoosh but no destination
        Engine.log('danger', `Address not found in database. Wormhole collapsed.`);
        setTimeout(() => {
          Wormhole.close(() => {
            s.dialedAddress = [];
            Wormhole.resetChevrons();
            renderScreen(s);
          });
        }, 2000);
      }
    });

    // Partial re-render to update status bar
    const gateStatus = document.querySelector('.gate-status-bar');
    if (gateStatus) gateStatus.innerHTML = '<span class="gate-status-dialing">◌ ENGAGING WORMHOLE…</span>';
  }

  function closeWormhole() {
    if (!State.isReady()) return;
    const s = State.get();
    Wormhole.close(() => {
      s.dialedAddress   = [];
      s.offWorld        = null;
      Wormhole.resetChevrons();
      _subScreen        = 'dhd';
      _currentWorldId   = null;
      _gateTeamSelected = [];
      renderScreen(s);
    });
  }

  function returnToBase() {
    if (!State.isReady()) return;
    const s = State.get();

    // Recall all off-world personnel before transit
    if (s.offWorld?.team) Personnel.recallTeam(s, s.offWorld.team);
    s.personnel.forEach(p => { p.offWorld = false; });

    Engine.log('info', 'SG team returning through the gate.');

    if (!s.events) s.events = { firedOneShot: [], gateTrips: 0 };
    s.events.gateTrips = (s.events.gateTrips ?? 0) + 1;

    _playTransit(() => {
      s.dialedAddress   = [];
      s.offWorld        = null;
      Wormhole.abort();          // snap internal state to idle
      Wormhole.resetChevrons();
      _subScreen        = 'dhd';
      _currentWorldId   = null;
      _gateTeamSelected = [];
      renderScreen(s);
      UI.navigateTo('gate');
    });
  }

  // ── Dev helpers ───────────────────────────────────────────────────────────

  function devUnlockAllGates() {
    if (!State.isReady()) return;
    const s = State.get();
    Decoding.unlockAll(s);
    UI.showNotification('All gate addresses unlocked.', 'success');
    Engine.log('info', '[DEV] All gate addresses unlocked.');
    renderScreen(s);
  }

  function devAddResources() {
    if (!State.isReady()) return;
    const s = State.get();
    ['naquadah','food','power','data','artifacts','alloys'].forEach(r => Resources.add(s, r, 999));
    UI.showNotification('+999 to all resources.', 'success');
    UI.updateResourceDisplay(s);
  }

  // ── Wormhole transit animation ────────────────────────────────────────────

  function _playTransit(callback) {
    const overlay = document.getElementById('wormhole-transit');
    const canvas  = document.getElementById('wt-canvas');
    if (!overlay || !canvas) { callback?.(); return; }

    const ctx = canvas.getContext('2d');

    // Size canvas to actual pixels
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = canvas.width  / 2;
    const cy = canvas.height / 2;
    const DURATION = 2600; // ms before fade-out begins

    // Streaks — radiate from centre outward
    const streaks = Array.from({ length: 90 }, () => ({
      angle:  Math.random() * Math.PI * 2,
      r:      Math.random() * Math.max(cx, cy) * 0.5,   // starting radius
      speed:  Math.random() * 4 + 2,
      len:    Math.random() * 55 + 20,
      alpha:  Math.random() * 0.7 + 0.3,
    }));

    let startTime = null;
    let rafId     = null;

    function drawFrame(ts) {
      if (!startTime) startTime = ts;
      const elapsed  = ts - startTime;
      const progress = Math.min(elapsed / DURATION, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background — deep space radial
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(cx, cy));
      bg.addColorStop(0,    '#0d1e3a');
      bg.addColorStop(0.55, '#040c1a');
      bg.addColorStop(1,    '#010408');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Tunnel rings — ellipses streaming toward viewer (shrink to centre)
      const RINGS = 10;
      for (let i = 0; i < RINGS; i++) {
        const phase  = ((progress * 1.8 + i / RINGS) % 1);      // 0→1 per loop
        const scale  = 1 - phase;                                  // 1→0 (edge→centre)
        const fade   = phase < 0.12 ? phase / 0.12
                     : phase > 0.82 ? (1 - phase) / 0.18
                     : 1;

        const rx = cx  * (scale * 1.5 + 0.05);
        const ry = cy  * (scale * 1.5 + 0.05) * 0.55; // perspective squish

        // Outer glow
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(14,165,200,${fade * 0.55})`;
        ctx.lineWidth   = 3;
        ctx.stroke();

        // Bright inner edge
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * 0.96, ry * 0.96, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56,212,240,${fade * 0.35})`;
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      }

      // Streaks — accelerate as progress increases
      const speedMult = 1 + progress * 5;
      streaks.forEach(st => {
        st.r += st.speed * speedMult;
        const maxR = Math.max(cx, cy) * 1.6;
        if (st.r > maxR) st.r = Math.random() * 10;

        const x1 = cx + Math.cos(st.angle) * st.r;
        const y1 = cy + Math.sin(st.angle) * st.r * 0.55;
        const tailLen = st.len * speedMult * 0.6;
        const x2 = cx + Math.cos(st.angle) * (st.r + tailLen);
        const y2 = cy + Math.sin(st.angle) * (st.r + tailLen) * 0.55;

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, `rgba(56,212,240,0)`);
        grad.addColorStop(1, `rgba(56,212,240,${st.alpha * 0.75})`);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      });

      // Central glow — pulses gently
      const glowR  = 60 + Math.sin(elapsed * 0.008) * 15;
      const glow   = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR * 3.5);
      glow.addColorStop(0,   'rgba(140,230,255,0.95)');
      glow.addColorStop(0.15,'rgba(56,212,240,0.65)');
      glow.addColorStop(0.5, 'rgba(14,165,200,0.25)');
      glow.addColorStop(1,   'rgba(14,165,200,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR * 3.5, 0, Math.PI * 2);
      ctx.fill();

      if (progress < 1) {
        rafId = requestAnimationFrame(drawFrame);
      } else {
        // Fade out overlay, then fire callback
        overlay.classList.remove('wt-fade-in');
        overlay.classList.add('wt-fade-out');
        setTimeout(() => {
          cancelAnimationFrame(rafId);
          overlay.classList.remove('wt-active', 'wt-fade-out');
          callback?.();
        }, 420);
      }
    }

    overlay.classList.add('wt-active', 'wt-fade-in');
    rafId = requestAnimationFrame(drawFrame);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    renderScreen,
    dialSymbol,
    clearAddress,
    speedDial,
    engageWormhole,
    closeWormhole,
    returnToBase,
    openAddressDecode,
    closeAddressDecode,
    toggleGateTeamMember,
    confirmGateTeam,
    devUnlockAllGates,
    devAddResources,
  };

})();
