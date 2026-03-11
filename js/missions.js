/**
 * STARGATE: REMNANTS — Missions
 * Mission catalogue, team assignment UI, stat-based resolution,
 * outcome generation, and debrief screen.
 *
 * Mission flow:
 *   1. Player selects mission type from planet's mission list
 *   2. Player assigns team members (validated by Personnel module)
 *   3. resolve() computes success chance from team stats + difficulty
 *   4. Roll determines outcome tier: critical_success / success / partial / failure / critical_failure
 *   5. Loot and consequences are applied, debrief shown
 */

const Missions = (() => {

  // ── Mission catalogue ─────────────────────────────────────────────────────
  /**
   * Each mission definition:
   * - primaryStat: main stat for success roll
   * - secondaryStat: supporting stat (adds 50% weight)
   * - baseDifficulty: 0.0–1.0, chance to succeed at stat average 5
   * - duration: in-game hours team is off-world
   * - loot: resource outcomes per tier
   * - combatRisk: 0–1, chance team takes damage on non-failure outcomes
   * - description + flavour text for UI
   */
  const MISSION_DEFS = Object.freeze({

    scout: {
      label:         'Reconnaissance',
      glyph:         '🔭',
      primaryStat:   'science',
      secondaryStat: 'survival',
      baseDifficulty: 0.60,
      duration:      3,
      combatRisk:    0.25,
      description:   'Survey the area, map terrain, and gather intelligence on threats and resources.',
      flavour:       'Eyes on target. Intel wins wars.',
      loot: {
        critical_success: { data: [4, 8], artifacts: [1, 3] },
        success:          { data: [2, 5] },
        partial:          { data: [1, 2] },
        failure:          {},
        critical_failure: {},
      },
    },

    forage: {
      label:         'Foraging Run',
      glyph:         '🌿',
      primaryStat:   'survival',
      secondaryStat: 'science',
      baseDifficulty: 0.70,
      duration:      2,
      combatRisk:    0.15,
      description:   'Gather food, medicinal plants, and biological samples from the local environment.',
      flavour:       'The land provides, for those who know how to ask.',
      loot: {
        critical_success: { food: [15, 28], rarePlants: [4, 8], medicine: [2, 5] },
        success:          { food: [10, 18], rarePlants: [2, 4] },
        partial:          { food: [4, 8] },
        failure:          {},
        critical_failure: {},
      },
    },

    excavate: {
      label:         'Excavation',
      glyph:         '⛏',
      primaryStat:   'science',
      secondaryStat: 'combat',
      baseDifficulty: 0.55,
      duration:      5,
      combatRisk:    0.20,
      description:   'Archaeological dig at ruins or sites of interest. Recover artefacts and data.',
      flavour:       'History is just waiting to be dug up.',
      loot: {
        critical_success: { artifacts: [5, 10], data: [3, 8], ancientTech: [1, 3] },
        success:          { artifacts: [3, 6],  data: [2, 4] },
        partial:          { artifacts: [1, 3] },
        failure:          {},
        critical_failure: {},
      },
    },

    diplomacy: {
      label:         'Diplomatic Contact',
      glyph:         '🤝',
      primaryStat:   'diplomacy',
      secondaryStat: 'science',
      baseDifficulty: 0.55,
      duration:      4,
      combatRisk:    0.10,
      description:   'Establish contact and relations with indigenous populations. Negotiate for resources or intelligence.',
      flavour:       'Words first. Weapons if we must.',
      loot: {
        critical_success: { food: [10, 20], medicine: [3, 6], alloys: [2, 5], data: [2, 4] },
        success:          { food: [5, 12],  medicine: [1, 3] },
        partial:          { food: [2, 6] },
        failure:          {},
        critical_failure: {},
      },
    },

    trade: {
      label:         'Trade Mission',
      glyph:         '⚖',
      primaryStat:   'diplomacy',
      secondaryStat: 'survival',
      baseDifficulty: 0.65,
      duration:      3,
      combatRisk:    0.05,
      description:   'Exchange goods with local population. Converts data and artefacts into food, medicine, and alloys.',
      flavour:       'Every economy runs on trust.',
      loot: {
        critical_success: { food: [15, 28], medicine: [4, 8], alloys: [3, 7] },
        success:          { food: [8, 16],  medicine: [2, 4] },
        partial:          { food: [4, 8] },
        failure:          {},
        critical_failure: {},
      },
      cost: { data: 2, artifacts: 1 }, // consumed on attempt
    },

    mining: {
      label:         'Naquadah Mining',
      glyph:         '⎊',
      primaryStat:   'survival',
      secondaryStat: 'combat',
      baseDifficulty: 0.60,
      duration:      6,
      combatRisk:    0.30,
      description:   'Extract naquadah and mineral alloys from the planet. Heavy work in potentially hostile conditions.',
      flavour:       'The gate runs on naquadah. So do we.',
      loot: {
        critical_success: { naquadah: [20, 35], alloys: [5, 10], crystals: [2, 5] },
        success:          { naquadah: [12, 22], alloys: [3, 6] },
        partial:          { naquadah: [5, 10] },
        failure:          {},
        critical_failure: {},
      },
    },

    tech_salvage: {
      label:         'Tech Salvage',
      glyph:         '🔧',
      primaryStat:   'science',
      secondaryStat: 'survival',
      baseDifficulty: 0.50,
      duration:      5,
      combatRisk:    0.25,
      description:   'Recover advanced or Ancient technology from ruins, ships, or automated facilities.',
      flavour:       'Dead systems still hold their secrets.',
      loot: {
        critical_success: { ancientTech: [1, 3], advancedTech: [3, 7], crystals: [4, 8] },
        success:          { advancedTech: [2, 5], crystals: [2, 5] },
        partial:          { crystals: [1, 3] },
        failure:          {},
        critical_failure: {},
      },
    },

    sabotage: {
      label:         'Sabotage Op',
      glyph:         '💥',
      primaryStat:   'combat',
      secondaryStat: 'science',
      baseDifficulty: 0.45,
      duration:      4,
      combatRisk:    0.55,
      description:   'Destroy Goa\'uld or hostile infrastructure. High risk, high reward. Expect contact.',
      flavour:       'Sometimes the best plan is controlled destruction.',
      loot: {
        critical_success: { alloys: [5, 10], advancedTech: [2, 4], naquadah: [4, 8] },
        success:          { alloys: [3, 6],  naquadah: [2, 5] },
        partial:          { naquadah: [1, 3] },
        failure:          {},
        critical_failure: {},
      },
    },

    medical_harvest: {
      label:         'Medical Harvest',
      glyph:         '⛑',
      primaryStat:   'science',
      secondaryStat: 'survival',
      baseDifficulty: 0.65,
      duration:      3,
      combatRisk:    0.10,
      description:   'Focused collection of medicinal plants and bio-samples for the base med bay.',
      flavour:       'Our people need medicine. Let\'s bring some home.',
      loot: {
        critical_success: { medicine: [8, 15], rarePlants: [5, 9] },
        success:          { medicine: [4, 9],  rarePlants: [2, 4] },
        partial:          { medicine: [2, 4] },
        failure:          {},
        critical_failure: {},
      },
    },

    research: {
      label:         'Field Research',
      glyph:         '🔬',
      primaryStat:   'science',
      secondaryStat: 'diplomacy',
      baseDifficulty: 0.60,
      duration:      4,
      combatRisk:    0.10,
      description:   'Conduct on-site scientific research. Requires high science stat. Returns data and Ancient knowledge.',
      flavour:       'The universe has rules. We\'re here to find them.',
      loot: {
        critical_success: { data: [8, 15], ancientTech: [2, 4], artifacts: [2, 4] },
        success:          { data: [4, 9],  ancientTech: [0, 2] },
        partial:          { data: [2, 4] },
        failure:          {},
        critical_failure: {},
      },
    },

    alliance: {
      label:         'Form Alliance',
      glyph:         '★',
      primaryStat:   'diplomacy',
      secondaryStat: 'combat',
      baseDifficulty: 0.40,
      duration:      7,
      combatRisk:    0.15,
      description:   'Forge a lasting alliance with this world\'s inhabitants. Long effort, major payoff. Unlocks ongoing trade.',
      flavour:       'Alone we survive. Together we thrive.',
      loot: {
        critical_success: { food: [20, 35], medicine: [5, 10], alloys: [5, 10], data: [4, 8] },
        success:          { food: [10, 20], medicine: [2, 6] },
        partial:          { food: [5, 10] },
        failure:          {},
        critical_failure: {},
      },
    },

    data_download: {
      label:         'Data Download',
      glyph:         '📡',
      primaryStat:   'science',
      secondaryStat: 'diplomacy',
      baseDifficulty: 0.55,
      duration:      5,
      combatRisk:    0.05,
      description:   'Interface with Ancient or advanced systems to extract data banks and operational codes.',
      flavour:       'The Ancients left notes. We just need to read them.',
      loot: {
        critical_success: { data: [18, 30], ancientTech: [2, 5] },
        success:          { data: [10, 20], ancientTech: [1, 3] },
        partial:          { data: [5, 10] },
        failure:          {},
        critical_failure: {},
      },
    },

  });

  // ── Outcome tiers ──────────────────────────────────────────────────────────

  const OUTCOME_TIERS = Object.freeze([
    { id: 'critical_success', label: 'Exceptional Success', glyph: '★', cssClass: 'tier-crit-success', threshold: 0.85 },
    { id: 'success',          label: 'Success',             glyph: '✓', cssClass: 'tier-success',      threshold: 0.55 },
    { id: 'partial',          label: 'Partial Success',     glyph: '◑', cssClass: 'tier-partial',      threshold: 0.30 },
    { id: 'failure',          label: 'Failure',             glyph: '✗', cssClass: 'tier-failure',      threshold: 0.10 },
    { id: 'critical_failure', label: 'Critical Failure',    glyph: '☠', cssClass: 'tier-crit-fail',    threshold: 0.00 },
  ]);

  // ── Debriefs per mission + tier ────────────────────────────────────────────

  const DEBRIEF_TEXT = Object.freeze({
    scout: {
      critical_success: 'The team returned with comprehensive maps, threat assessments, and resource coordinates. Textbook operation.',
      success:          'Good intel gathered. Map coverage is solid. A few areas remain unexplored.',
      partial:          'Partial map acquired. The team ran into complications and returned early.',
      failure:          'Mission aborted. The team encountered overwhelming obstacles and pulled back empty-handed.',
      critical_failure: 'Disaster. The team was compromised and barely escaped. Some equipment was lost. Casualties possible.',
    },
    forage: {
      critical_success: 'An extraordinary haul. The world was more abundant than anyone expected.',
      success:          'Good yield. The team found what they were looking for.',
      partial:          'Below expectations. Slim pickings — the season, weather, or terrain worked against us.',
      failure:          'Nothing of use found. The team returned empty-handed and exhausted.',
      critical_failure: 'Mission collapsed. Equipment lost and personnel injured in rough terrain.',
    },
    excavate: {
      critical_success: 'A major find. The site was exceptionally well preserved. Artefacts and data of enormous value recovered.',
      success:          'Good progress on the dig. Several items of clear scientific value.',
      partial:          'The site was more complex than expected. A few fragments recovered.',
      failure:          'The site was either picked clean or inaccessible. Nothing recovered.',
      critical_failure: 'Structural collapse triggered. The site is destroyed and team members injured.',
    },
    diplomacy: {
      critical_success: 'Extraordinary rapport established. The locals view us as trusted allies. Trade routes opened.',
      success:          'Positive first contact. Relations are warm and a follow-up visit is welcomed.',
      partial:          'Cautious interest. The locals are not hostile, but remain guarded.',
      failure:          'Relations soured. The team retreated before things escalated.',
      critical_failure: 'Diplomatic incident. The team is no longer welcome on this world.',
    },
    trade: {
      critical_success: 'Exceptional deal struck. The locals drove a generous bargain.',
      success:          'Fair trade completed. Both sides satisfied.',
      partial:          'Thin trade. They were not in a generous mood.',
      failure:          'Negotiations collapsed. Goods were refused.',
      critical_failure: 'The exchange went badly. Goods lost with nothing received.',
    },
    mining: {
      critical_success: 'Rich vein tapped. The return load is substantial.',
      success:          'Productive extraction run. Strong haul.',
      partial:          'Modest yield. Deposits were thinner than hoped.',
      failure:          'The site was depleted or inaccessible. Nothing worth taking.',
      critical_failure: 'Equipment destroyed and team injured in a collapse or firefight.',
    },
    tech_salvage: {
      critical_success: 'An intact cache of advanced tech — possibly the best find since the programme began.',
      success:          'Good salvage. Several working components recovered.',
      partial:          'Marginal finds. Most tech was degraded or already stripped.',
      failure:          'Nothing intact enough to be useful.',
      critical_failure: 'Unknown system activated. Team barely escaped an automated response.',
    },
    sabotage: {
      critical_success: 'Target destroyed completely. Enemy infrastructure set back significantly.',
      success:          'Primary objective achieved. Some collateral recovered from the wreckage.',
      partial:          'Partial damage inflicted. The objective was only partly achieved.',
      failure:          'Mission compromised before objective reached. Forced withdrawal.',
      critical_failure: 'Ambush. Team pinned down. Significant injuries. The target survived.',
    },
    medical_harvest: {
      critical_success: 'Extraordinary specimens collected. The med bay will be stocked for weeks.',
      success:          'Good harvest. The base medic will have what they need.',
      partial:          'Thin collection. Better than nothing.',
      failure:          'Little of value found. The local flora wasn\'t what the briefing suggested.',
      critical_failure: 'Team exposed to toxic flora. Several members require treatment on return.',
    },
    research: {
      critical_success: 'Breakthrough. The data returned will accelerate our research by weeks.',
      success:          'Solid science. Several useful findings documented.',
      partial:          'Inconclusive results. A few datapoints of minor interest.',
      failure:          'Nothing usable. The systems were either offline or encrypted.',
      critical_failure: 'Experiment triggered an unexpected reaction. Team injured. Equipment lost.',
    },
    alliance: {
      critical_success: 'Historic accord reached. This world is now a full ally of the programme.',
      success:          'Alliance formed. Mutual support agreed upon.',
      partial:          'Talks advanced but not concluded. A framework is in place.',
      failure:          'Alliance not formed. The discussions stalled.',
      critical_failure: 'Relations ruptured. A misunderstanding turned serious. We will not be welcome back.',
    },
    data_download: {
      critical_success: 'Full archive downloaded. The data density is extraordinary — years of analysis ahead.',
      success:          'Successful data extraction. Large volume recovered.',
      partial:          'Partial download before the connection was lost.',
      failure:          'The system refused access or was incompatible.',
      critical_failure: 'Interface triggered a security response. The system is now locked and team members were stunned.',
    },
  });

  // ── Resolution engine ──────────────────────────────────────────────────────

  /**
   * Compute the team's effective stat score for a mission.
   * Uses primary stat (full weight) + secondary stat (50% weight), averaged across team.
   * @param {string[]} teamIds
   * @param {GameState} s
   * @param {object} missionDef
   * @returns {{ score: number, breakdown: object[] }}
   */
  function _teamScore(teamIds, s, missionDef) {
    const { primaryStat, secondaryStat } = missionDef;
    let total = 0;
    const breakdown = [];

    teamIds.forEach(id => {
      const p = s.personnel.find(p => p.id === id);
      if (!p || !p.alive) return;
      const eff    = Personnel.effectiveStats(p, s);
      const pScore = eff[primaryStat]  ?? 0;
      const sScore = eff[secondaryStat] ?? 0;
      const contrib = pScore + sScore * 0.5;
      total += contrib;
      breakdown.push({
        name:     p.name,
        primary:  pScore,
        secondary: sScore,
        contrib,
      });
    });

    const score = teamIds.length > 0 ? total / teamIds.length : 0;
    return { score, breakdown };
  }

  /**
   * Compute success probability from team score + mission difficulty.
   * @param {number} score   — 0–15 (primary + 50% secondary, max ~15)
   * @param {number} baseDiff — 0–1 base difficulty
   * @param {string} difficulty — game difficulty string
   * @returns {number} probability 0–1
   */
  function _successProb(score, baseDiff, difficulty) {
    // Normalise score: score 7.5 (middle of range) ≈ base difficulty
    const MAX_SCORE  = CONFIG.MAX_STAT_LEVEL * 1.5; // 15
    const normalised = score / MAX_SCORE;            // 0–1
    const bonus      = (CONFIG.DIFFICULTY[difficulty]?.missionSuccessBonus ?? 0);
    // Linear interpolation: at normalised=0 → 10%, at normalised=1 → 95%
    const raw = 0.10 + normalised * 0.85 + bonus;
    // Apply base difficulty as multiplier
    return Math.max(0.05, Math.min(0.97, raw * (baseDiff / 0.60)));
  }

  /**
   * Roll for outcome tier based on probability.
   * @param {number} prob success probability
   * @returns {string} tier id
   */
  function _rollOutcome(prob) {
    const roll = Math.random();
    if (roll >= (1 - prob * 0.15))  return 'critical_success';
    if (roll >= (1 - prob))         return 'success';
    if (roll >= (1 - prob) - 0.20)  return 'partial';
    if (roll >= 0.07)               return 'failure';
    return 'critical_failure';
  }

  /**
   * Generate loot from a mission loot table entry.
   * @param {{ [resource]: [min, max] }} lootEntry
   * @returns {{ [resource]: number }}
   */
  function _rollLoot(lootEntry) {
    const out = {};
    if (!lootEntry) return out;
    Object.entries(lootEntry).forEach(([res, [min, max]]) => {
      const amount = Math.floor(Math.random() * (max - min + 1)) + min;
      if (amount > 0) out[res] = amount;
    });
    return out;
  }

  /**
   * Apply combat damage if the mission has combat risk.
   * @param {string[]} teamIds
   * @param {object} missionDef
   * @param {string} tierId
   * @param {GameState} s
   * @returns {Array<{name:string, dmg:number}>}
   */
  function _applyCombatDamage(teamIds, missionDef, tierId, s) {
    const injuries = [];
    const riskMultiplier = tierId === 'failure' ? 1.5
                         : tierId === 'critical_failure' ? 2.5
                         : tierId === 'partial' ? 0.75
                         : 0.5;

    const diffMult = CONFIG.DIFFICULTY[s.difficulty]?.combatDamageMultiplier ?? 1.0;

    if (Math.random() < missionDef.combatRisk * riskMultiplier) {
      teamIds.forEach(id => {
        const p = s.personnel.find(p => p.id === id);
        if (!p || !p.alive) return;
        if (Math.random() < 0.6) { // 60% chance each member takes damage
          const eff = Personnel.effectiveStats(p, s);
          const dmgReduction = eff.combat / (CONFIG.MAX_STAT_LEVEL * 2); // high combat = less dmg
          const base = Math.floor(Math.random() * 30 + 10);
          const dmg  = Math.max(3, Math.round(base * (1 - dmgReduction) * diffMult));
          p.health = Math.max(1, p.health - dmg); // survive on 1 HP at minimum during mission
          injuries.push({ name: p.name, dmg });
        }
      });
    }

    return injuries;
  }

  /**
   * Full mission resolution. Applies all effects to state.
   * @param {GameState} s
   * @param {string} missionId - key in MISSION_DEFS
   * @param {string[]} teamIds
   * @param {string} worldId
   * @returns {MissionResult}
   */
  function resolve(s, missionId, teamIds, worldId) {
    const mDef    = MISSION_DEFS[missionId];
    if (!mDef) return { ok: false, reason: `Unknown mission: ${missionId}` };

    const { score, breakdown } = _teamScore(teamIds, s, mDef);
    const prob    = _successProb(score, mDef.baseDifficulty, s.difficulty);
    const tierId  = _rollOutcome(prob);
    const loot    = _rollLoot(mDef.loot[tierId]);
    const injuries = _applyCombatDamage(teamIds, mDef, tierId, s);

    // Apply loot to state
    Object.entries(loot).forEach(([res, amt]) => {
      Resources.add(s, res, amt);
    });

    // Special reward — Pegasus address
    const planet = planetById(worldId);
    let specialReward = null;
    if (planet?.specialReward === 'pegasus_address'
        && (tierId === 'success' || tierId === 'critical_success')
        && !s.flags.pegasusAddressKnown) {
      s.flags.pegasusAddressKnown = true;
      specialReward = 'pegasus_address';
    }

    // Decoding intel — scout, research, diplomacy missions grant intel on other worlds
    let decodingIntel = null;
    if (['scout', 'research', 'diplomacy'].includes(missionId)
        && (tierId === 'success' || tierId === 'critical_success' || tierId === 'partial')) {
      // Pick a random locked world to grant intel for
      const locked = PLANET_DB.filter(def =>
        !def.decoded &&
        def.id !== worldId &&
        s.decoding?.[def.id]?.state !== 'decoded'
      );
      if (locked.length > 0) {
        const target = locked[Math.floor(Math.random() * locked.length)];
        const r = Decoding.grantMissionIntel(s, target.id, () => {});
        if (r.ok && (r.revealed?.length > 0 || r.newState)) {
          decodingIntel = { worldId: target.id, worldName: target.name, revealed: r.revealed, newState: r.newState };
        }
      }
    }

    const tier = OUTCOME_TIERS.find(t => t.id === tierId);

    return {
      ok:           true,
      missionId,
      worldId,
      tierId,
      tier,
      score:        Math.round(score * 10) / 10,
      prob:         Math.round(prob * 100),
      loot,
      injuries,
      debrief:      DEBRIEF_TEXT[missionId]?.[tierId] ?? 'Mission complete.',
      breakdown,
      specialReward,
      decodingIntel,
      teamIds,
    };
  }

  // ── Team selection UI ──────────────────────────────────────────────────────

  let _selectedTeam    = [];
  let _selectedMission = null;
  let _activeWorldId   = null;

  function renderMissionPanel(s, worldId) {
    const container = document.getElementById('gate-mission-panel');
    if (!container) return;

    _activeWorldId = worldId;
    const planet = planetById(worldId);
    if (!planet) return;

    const worldState = s.worlds.find(w => w.id === worldId);

    // Build mission list — use visit-specific selection if available, else full list
    const missionList      = s.offWorld?.activeMissions ?? planet.missions;
    const completedThisTrip = s.offWorld?.completedMissions ?? [];
    const missionHtml = missionList.map(mId => {
      const mDef = MISSION_DEFS[mId];
      if (!mDef) return '';
      const isActive = _selectedMission === mId;
      const isDone   = completedThisTrip.includes(mId);
      return `
        <div class="mission-card ${isActive ? 'mission-active' : ''} ${isDone ? 'mission-done' : ''}"
             onclick="${isDone ? '' : `Missions.selectMission('${mId}')`}">
          <div class="mission-header">
            <span class="mission-glyph">${isDone ? '✓' : mDef.glyph}</span>
            <div class="mission-info">
              <div class="mission-label">${mDef.label}${isDone ? ' <span class="dim">(complete)</span>' : ''}</div>
              <div class="mission-meta dim">
                ${mDef.duration}h · ${_primaryStatLabel(mDef.primaryStat)}
                <span class="threat-dot threat-${_riskClass(mDef.combatRisk)}"
                      title="Combat risk: ${Math.round(mDef.combatRisk * 100)}%">⬤</span>
              </div>
            </div>
          </div>
          ${isActive ? `<div class="mission-desc">${mDef.description}</div>` : ''}
        </div>`;
    }).join('');

    // Team selection (if mission selected)
    let teamHtml = '';
    if (_selectedMission) {
      const mDef = MISSION_DEFS[_selectedMission];
      teamHtml = _renderTeamSelector(s, mDef);
    }

    container.innerHTML = `
      <div class="mission-panel-inner">
        <div class="mission-list-col">
          <div class="panel-sub-title">Available Missions</div>
          ${missionHtml || '<p class="dim">No missions available.</p>'}
        </div>
        ${_selectedMission ? `
        <div class="mission-assign-col">
          <div class="panel-sub-title">Assign Team</div>
          ${teamHtml}
        </div>` : ''}
      </div>`;
  }

  function _renderTeamSelector(s, mDef) {
    // Only gate team members may be assigned to off-world missions
    const gateTeam      = s.offWorld?.team ?? [];
    const usedThisTrip  = s.offWorld?.usedPersonnel ?? [];

    const prob = _selectedTeam.length > 0
      ? _successProb(
          _teamScore(_selectedTeam, s, mDef).score,
          mDef.baseDifficulty,
          s.difficulty
        ) : null;

    const probStr  = prob !== null ? `${Math.round(prob * 100)}%` : '—';
    const probClass = prob === null ? '' : prob >= 0.7 ? 'prob-good' : prob >= 0.45 ? 'prob-warn' : 'prob-bad';

    const teamCards = s.personnel.map(p => {
      if (!p.alive) return '';
      if (!gateTeam.includes(p.id)) return '';   // not through the gate
      const inTeam    = _selectedTeam.includes(p.id);
      const alreadyUsed = usedThisTrip.includes(p.id);
      const check     = alreadyUsed
        ? { ok: false, reason: `${p.name} has already run a mission this trip.` }
        : Personnel.canAssignToTeam(s, p.id);
      const canAdd    = check.ok;
      const arch      = Personnel.ARCHETYPES[p.archetype] ?? Personnel.ARCHETYPES.balanced;
      const eff       = Personnel.effectiveStats(p, s);
      const primary   = eff[mDef.primaryStat];
      const secondary = eff[mDef.secondaryStat];
      return `
        <div class="team-member-card ${inTeam ? 'in-team' : ''} ${!canAdd ? 'unavailable' : ''}"
             onclick="${canAdd ? `Missions.toggleTeamMember('${p.id}')` : ''}"
             title="${check.reason || p.name}">
          <span class="arch-glyph">${arch.callout}</span>
          <div class="member-info">
            <div class="member-name">${p.name}</div>
            <div class="member-stats dim">
              ${mDef.glyph} ${primary}<span class="dim"> / </span>${mDef.secondaryStat === mDef.primaryStat ? '' : `${_statGlyph(mDef.secondaryStat)} ${secondary}`}
              <span class="dim hp-inline">${p.health}hp</span>
            </div>
          </div>
          ${inTeam ? '<span class="in-team-badge">✓</span>' : ''}
          ${!canAdd ? `<span class="unavail-badge dim" title="${check.reason}">—</span>` : ''}
        </div>`;
    }).join('');

    const canLaunch = _selectedTeam.length > 0;

    return `
      <div class="team-selector">
        <div class="prob-display">
          Success estimate: <span class="prob-value ${probClass}">${probStr}</span>
          <span class="dim" style="font-size:14px"> (${_selectedTeam.length}/${CONFIG.MAX_TEAM_SIZE} members)</span>
        </div>
        <div class="team-member-list">${teamCards}</div>
        <button class="btn btn-amber launch-mission-btn"
                ${canLaunch ? '' : 'disabled'}
                onclick="Missions.launchMission()">
          ◎ Launch Mission
        </button>
        ${_selectedTeam.length === 0 ? '<p class="dim" style="font-size:14px;margin-top:4px">Select at least one team member</p>' : ''}
      </div>`;
  }

  function _primaryStatLabel(statKey) {
    return Personnel.STATS.find(s => s.key === statKey)?.label ?? statKey;
  }

  function _statGlyph(statKey) {
    return Personnel.STATS.find(s => s.key === statKey)?.glyph ?? '?';
  }

  function _riskClass(risk) {
    if (risk <= 0.15) return 'low';
    if (risk <= 0.30) return 'medium';
    if (risk <= 0.50) return 'high';
    return 'very-high';
  }

  function selectMission(missionId) {
    _selectedMission = _selectedMission === missionId ? null : missionId;
    _selectedTeam = [];
    if (State.isReady() && _activeWorldId) {
      renderMissionPanel(State.get(), _activeWorldId);
    }
  }

  function toggleTeamMember(personnelId) {
    if (!State.isReady()) return;
    const s = State.get();
    if (_selectedTeam.includes(personnelId)) {
      _selectedTeam = _selectedTeam.filter(id => id !== personnelId);
    } else {
      if (_selectedTeam.length >= CONFIG.MAX_TEAM_SIZE) {
        UI.showNotification(`Max team size is ${CONFIG.MAX_TEAM_SIZE}.`, 'warn');
        return;
      }
      const check = Personnel.canAssignToTeam(s, personnelId);
      if (!check.ok) {
        UI.showNotification(check.reason, 'warn');
        return;
      }
      _selectedTeam.push(personnelId);
    }
    if (_activeWorldId) renderMissionPanel(s, _activeWorldId);
  }

  function launchMission() {
    if (!State.isReady() || !_selectedMission || _selectedTeam.length === 0) return;
    const s      = State.get();
    const mDef   = MISSION_DEFS[_selectedMission];
    const planet = planetById(_activeWorldId);

    // Validate team
    const validation = Personnel.validateTeam(s, _selectedTeam);
    if (!validation.ok) {
      UI.showNotification(validation.errors[0], 'warn');
      return;
    }

    // Cost check
    if (mDef.cost) {
      if (!Resources.canAfford(s, mDef.cost)) {
        UI.showNotification('Not enough resources for this mission.', 'warn');
        return;
      }
      Resources.spend(s, mDef.cost);
    }

    // Deploy team off-world
    Personnel.deployTeam(s, _selectedTeam);

    // Advance game clock by mission duration before resolving
    Engine.advanceHours(mDef.duration);

    // Resolve immediately (simulation — in a full async system this would tick duration)
    const result = resolve(s, _selectedMission, _selectedTeam, _activeWorldId);

    // Recall team
    Personnel.recallTeam(s, _selectedTeam);

    // Log
    const tierLabel = result.tier?.label ?? result.tierId;
    Engine.log(
      result.tierId.includes('failure') ? 'danger' : result.tierId === 'critical_success' ? 'benefit' : 'info',
      `${mDef.label} on ${planet?.name ?? _activeWorldId}: ${tierLabel}.`
    );
    if (result.specialReward === 'pegasus_address') {
      Engine.log('benefit', 'The Pegasus gate address has been recovered from the Ancient outpost. The path home is open.');
    }

    // Record mission and personnel as used for this trip
    if (s.offWorld) {
      s.offWorld.completedMissions = [...(s.offWorld.completedMissions ?? []), _selectedMission];
      s.offWorld.usedPersonnel     = [...new Set([...(s.offWorld.usedPersonnel ?? []), ..._selectedTeam])];
    }

    // Reset selections
    const teamCopy = [..._selectedTeam];
    _selectedTeam    = [];
    _selectedMission = null;

    // Phase 8: Audio mission outcome
    if (typeof Audio !== 'undefined') {
      if (result.tierId === 'critical_success' || result.tierId === 'success') Audio.play('success');
      else if (result.tierId.includes('failure')) Audio.play('failure');
    }

    // Show debrief
    showDebrief(result, s);
  }

  // ── Debrief screen ────────────────────────────────────────────────────────

  function showDebrief(result, s) {
    const container = document.getElementById('gate-debrief');
    if (!container) return;

    const mDef   = MISSION_DEFS[result.missionId];
    const planet = planetById(result.worldId);
    const tier   = result.tier;

    const lootRows = Object.entries(result.loot).map(([res, amt]) =>
      `<div class="debrief-loot-row"><span class="dim">${res}</span><span class="loot-amt">+${amt}</span></div>`
    ).join('');

    const injuryRows = result.injuries.map(inj =>
      `<div class="debrief-injury-row"><span class="dim">${inj.name}</span><span class="injury-dmg">−${inj.dmg} HP</span></div>`
    ).join('');

    const breakdownRows = result.breakdown.map(b =>
      `<div class="debrief-br-row dim"><span>${b.name}</span><span>${b.primary}/${b.secondary} = ${Math.round(b.contrib*10)/10}</span></div>`
    ).join('');

    container.innerHTML = `
      <div class="debrief-overlay">
        <div class="debrief-panel">
          <div class="debrief-header ${tier?.cssClass}">
            <span class="debrief-tier-glyph">${tier?.glyph ?? '?'}</span>
            <div>
              <div class="debrief-tier-label">${tier?.label ?? result.tierId}</div>
              <div class="debrief-mission-name">${mDef?.label ?? result.missionId} · ${planet?.name ?? result.worldId}</div>
            </div>
            <div class="debrief-prob dim">Est. ${result.prob}% · Score ${result.score}</div>
          </div>

          <div class="debrief-body">
            <p class="debrief-text">${result.debrief}</p>

            ${result.specialReward === 'pegasus_address' ? `
              <div class="debrief-special">
                ⌬ PEGASUS GATE ADDRESS RECOVERED — The path to Atlantis is open.
              </div>` : ''}

            ${result.decodingIntel ? `
              <div class="debrief-intel">
                <span class="debrief-intel-icon">◑</span>
                <div>
                  <div class="debrief-intel-title">Intel Recovered — ${result.decodingIntel.worldName}</div>
                  <div class="debrief-intel-body dim">
                    ${result.decodingIntel.revealed?.length > 0
                      ? `Symbol${result.decodingIntel.revealed.length > 1 ? 's' : ''} identified: ${result.decodingIntel.revealed.map(n => (SYMBOLS.find(x=>x.name===n)?.glyph??'') + ' ' + n).join(', ')}`
                      : `World rumoured — check the Intel tab for details.`}
                  </div>
                </div>
              </div>` : ''}

            <div class="debrief-cols">
              <div class="debrief-col">
                <div class="debrief-col-title">Resources Recovered</div>
                ${lootRows || '<span class="dim">Nothing</span>'}
              </div>
              <div class="debrief-col">
                <div class="debrief-col-title">Personnel Status</div>
                ${injuryRows || '<span class="dim">No casualties</span>'}
              </div>
              <div class="debrief-col">
                <div class="debrief-col-title">Team Contribution</div>
                ${breakdownRows}
              </div>
            </div>
          </div>

          <div class="debrief-footer">
            <button class="btn btn-olive" onclick="Missions.closeDebrief()">Close Report</button>
          </div>
        </div>
      </div>`;

    container.classList.add('visible');
  }

  function closeDebrief() {
    const container = document.getElementById('gate-debrief');
    if (container) container.classList.remove('visible');
    // Refresh gate screen
    if (State.isReady()) Gate.renderScreen(State.get());
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    MISSION_DEFS,
    OUTCOME_TIERS,
    resolve,
    renderMissionPanel,
    selectMission,
    toggleTeamMember,
    launchMission,
    showDebrief,
    closeDebrief,
  };

})();
