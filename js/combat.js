/**
 * STARGATE: REMNANTS — Combat  (Phase 7)
 *
 * Handles gate-defence combat resolution when an inbound gate event
 * results in a fight.  All mission-field combat lives in missions.js;
 * this module owns base-defence combat only.
 *
 * Public API
 * ──────────
 *   Combat.resolveGateDefence(s, defenders, threatType, threatLevel)
 *     → { logType, msg, effects }
 *
 * Threat types   : 'jaffa' | 'goauld_envoy' | 'replicator'
 * Threat levels  : 'low' | 'medium' | 'high'
 *
 * Defence modifiers applied (from research):
 *   combat_training          → +15% success chance, -15% incoming damage
 *   naquadah_enhanced_weapons → +15% success chance, +20% enemy kills
 *   perimeter_sensors        → early-warning: +10% success chance
 *   gate_shield_protocols    → iris absorbs 50% of breach damage
 *   omega_protocol           → -40% damage on loss, +2 effective combat for all
 */

const Combat = (() => {

  // ── Threat profiles ──────────────────────────────────────────────────────

  /**
   * Threat definitions.
   * baseSuccessThreshold: avg-combat score (0–10) required for a 50/50 fight.
   * baseDamage: HP damage range [min, max] per defender on a loss.
   * killChanceOnLoss: probability each defender dies (not just injured) on loss.
   * lootOnWin: resource gains when defenders win.
   */
  const THREATS = Object.freeze({
    jaffa: {
      low: {
        label:               'Jaffa Patrol (light)',
        baseSuccessThreshold: 3.5,
        baseDamage:           [8, 22],
        killChanceOnLoss:     0.10,
        lootOnWin:  { alloys: 5, naquadah: 4 },
        lootOnWin_crit: { alloys: 8, naquadah: 6, advancedTech: 1 },
      },
      medium: {
        label:               'Jaffa Incursion (armed)',
        baseSuccessThreshold: 5.0,
        baseDamage:           [15, 35],
        killChanceOnLoss:     0.20,
        lootOnWin:  { alloys: 6, naquadah: 5, advancedTech: 1 },
        lootOnWin_crit: { alloys: 10, naquadah: 8, advancedTech: 2, crystals: 3 },
      },
      high: {
        label:               'Jaffa Elite Strike Force',
        baseSuccessThreshold: 7.0,
        baseDamage:           [25, 50],
        killChanceOnLoss:     0.35,
        lootOnWin:  { alloys: 8, naquadah: 8, advancedTech: 3 },
        lootOnWin_crit: { alloys: 14, naquadah: 12, advancedTech: 4, crystals: 4 },
      },
    },

    goauld_envoy: {
      low: {
        label:               "Goa'uld Herald",
        baseSuccessThreshold: 4.0,
        baseDamage:           [12, 28],
        killChanceOnLoss:     0.12,
        lootOnWin:  { alloys: 5, naquadah: 6 },
        lootOnWin_crit: { alloys: 8, naquadah: 9, ancientTech: 1 },
      },
      medium: {
        label:               "Goa'uld Shock Troops",
        baseSuccessThreshold: 5.5,
        baseDamage:           [20, 40],
        killChanceOnLoss:     0.25,
        lootOnWin:  { alloys: 8, naquadah: 8, advancedTech: 2 },
        lootOnWin_crit: { alloys: 12, naquadah: 12, advancedTech: 3, crystals: 3 },
      },
      high: {
        label:               "Goa'uld System Lord Guard",
        baseSuccessThreshold: 7.5,
        baseDamage:           [30, 55],
        killChanceOnLoss:     0.40,
        lootOnWin:  { alloys: 10, naquadah: 12, advancedTech: 4 },
        lootOnWin_crit: { alloys: 16, naquadah: 18, advancedTech: 6, ancientTech: 2 },
      },
    },

    replicator: {
      low: {
        label:               'Replicator Scouts',
        baseSuccessThreshold: 5.0,
        baseDamage:           [15, 30],
        killChanceOnLoss:     0.15,
        lootOnWin:  { naniteTech: 1, advancedTech: 2 },
        lootOnWin_crit: { naniteTech: 2, advancedTech: 4, data: 8 },
      },
      medium: {
        label:               'Replicator Swarm',
        baseSuccessThreshold: 6.5,
        baseDamage:           [22, 45],
        killChanceOnLoss:     0.30,
        lootOnWin:  { naniteTech: 2, advancedTech: 3, data: 6 },
        lootOnWin_crit: { naniteTech: 3, advancedTech: 5, data: 12 },
      },
      high: {
        label:               'Replicator Hive',
        baseSuccessThreshold: 8.0,
        baseDamage:           [30, 60],
        killChanceOnLoss:     0.45,
        lootOnWin:  { naniteTech: 3, advancedTech: 5, data: 10 },
        lootOnWin_crit: { naniteTech: 5, advancedTech: 8, data: 18, crystals: 3 },
      },
    },
  });

  // ── Research defence modifiers ────────────────────────────────────────────

  /**
   * Gather all active defensive research bonuses.
   * Returns { successBonus, damageReduction, irisAbsorption, omegaProtocol }
   */
  function _getResearchBonuses(s) {
    const res = s.research.researched;
    return {
      successBonus:   (res.includes('combat_training')           ? 0.15 : 0)
                    + (res.includes('naquadah_enhanced_weapons')  ? 0.15 : 0)
                    + (res.includes('perimeter_sensors')          ? 0.10 : 0),
      damageReduction: res.includes('combat_training')            ? 0.15 : 0,
      irisAbsorption:  res.includes('gate_shield_protocols')      ? 0.50 : 0,
      omegaProtocol:   res.includes('omega_protocol'),
      omegaDmgReduc:   res.includes('omega_protocol')             ? 0.40 : 0,
      weaponBonus:     res.includes('naquadah_enhanced_weapons')  ? 0.20 : 0,
    };
  }

  /**
   * Get the effective combat score for a defender, including item bonuses
   * and research stat bonuses.
   */
  function _defenderCombat(p, s) {
    const eff = Personnel.effectiveStats(p, s);
    // omega_protocol grants +2 effective combat to all personnel
    const omegaBonus = s.research.researched.includes('omega_protocol') ? 2 : 0;
    return Math.min(CONFIG.MAX_STAT_LEVEL, (eff.combat ?? 0) + omegaBonus);
  }

  // ── Core resolution ───────────────────────────────────────────────────────

  /**
   * Resolve a gate-defence combat encounter.
   *
   * @param {GameState} s
   * @param {Personnel[]} defenders   — filtered to alive + on-base
   * @param {string}  threatType      — 'jaffa' | 'goauld_envoy' | 'replicator'
   * @param {string}  threatLevel     — 'low' | 'medium' | 'high'
   * @returns {{ logType, msg, effects }}
   */
  function resolveGateDefence(s, defenders, threatType, threatLevel) {

    // ── Fallback if no defenders ────────────────────────────────────────
    if (!defenders || defenders.length === 0) {
      return {
        logType: 'danger',
        msg:     'No defenders available. Gate room was breached unopposed.',
        effects: { resourceDelta: { food: -8, naquadah: -6 } },
      };
    }

    const threat  = THREATS[threatType]?.[threatLevel] ?? THREATS.jaffa.medium;
    const bonuses = _getResearchBonuses(s);
    const diff    = CONFIG.DIFFICULTY[s.difficulty]?.combatDamageMultiplier ?? 1.0;

    // ── Team combat score ───────────────────────────────────────────────
    const avgCombat = defenders.reduce((sum, p) => sum + _defenderCombat(p, s), 0)
                    / defenders.length;

    // Success probability: scales from 0.1 at 0 combat → 0.9 at MAX_STAT
    const baseChance = 0.10 + (avgCombat / CONFIG.MAX_STAT_LEVEL) * 0.80;
    const finalChance = Math.min(0.92, Math.max(0.05,
      baseChance + bonuses.successBonus - (threat.baseSuccessThreshold / CONFIG.MAX_STAT_LEVEL) * 0.15
    ));

    const won  = Math.random() < finalChance;
    const crit = won && Math.random() < 0.30;  // critical victory chance

    // ── Apply outcomes ──────────────────────────────────────────────────
    const injuries = [];

    if (won) {
      // Minor injuries even in victory
      defenders.forEach(p => {
        if (Math.random() < 0.25) {
          const [min, max] = threat.baseDamage;
          const raw = Math.floor(Math.random() * (max - min) + min);
          // Victory: take 30–50% of loss damage
          const dmg = Math.max(1, Math.round(raw * 0.4 * (1 - bonuses.damageReduction) * diff));
          p.health = Math.max(1, p.health - dmg);  // survive with at least 1 HP in victory
          injuries.push({ name: p.name, dmg });
        }
      });

      const loot = crit ? { ...threat.lootOnWin_crit } : { ...threat.lootOnWin };

      // Weapon research bonus: +20% loot on win
      if (bonuses.weaponBonus > 0) {
        Object.keys(loot).forEach(k => {
          loot[k] = Math.ceil(loot[k] * (1 + bonuses.weaponBonus));
        });
      }

      const inj = injuries.length
        ? ` ${injuries.map(i => `${i.name} −${i.dmg}HP`).join(', ')}.`
        : '';

      return {
        logType: crit ? 'benefit' : 'info',
        msg: crit
          ? `Gate room defended decisively. ${threat.label} eliminated. Weapons and armour salvaged.${inj}`
          : `Gate room held. ${threat.label} repelled after sharp fighting. Weapons recovered.${inj}`,
        effects: { resourceDelta: loot },
      };

    } else {
      // Defeat: defenders take heavy damage; some may die
      const killed = [];
      defenders.forEach(p => {
        const [min, max] = threat.baseDamage;
        const raw  = Math.floor(Math.random() * (max - min) + min);
        let reduc  = bonuses.damageReduction + bonuses.irisAbsorption + bonuses.omegaDmgReduc;
        const dmg  = Math.max(2, Math.round(raw * (1 - reduc) * diff));
        p.health   = Math.max(0, p.health - dmg);

        if (p.health === 0) {
          const killRoll = Math.random();
          const threshold = threat.killChanceOnLoss * (1 - bonuses.irisAbsorption * 0.5);
          if (killRoll < threshold) {
            p.alive = false;
            killed.push(p.name);
          } else {
            // Survive on 1 HP — critical but alive
            p.health = 1;
            injuries.push({ name: p.name, dmg: dmg - 1 });
          }
        } else {
          injuries.push({ name: p.name, dmg });
        }
      });

      const inj  = injuries.map(i => `${i.name} −${i.dmg}HP`).join(', ');
      const dead = killed.length ? `\n${killed.join(', ')} KIA.` : '';
      const iris = bonuses.irisAbsorption > 0
        ? ' Iris protocols absorbed partial breach damage.'
        : '';

      return {
        logType: 'danger',
        msg: `Gate room breached. ${threat.label} forced back — but at heavy cost.${iris}\nInjured: ${inj || 'none'}.${dead}`,
        effects: { resourceDelta: { food: -4, alloys: -3 } },
      };
    }
  }

  // ── ZPM / Win Condition ──────────────────────────────────────────────────

  /**
   * Check whether the player can install a ZPM right now.
   * Requires: zpm_interface research + zpmInterfaceResearched flag.
   * Called by engine when checking win condition triggers.
   */
  function canInstallZPM(s) {
    return s.flags.zpmInterfaceResearched &&
           s.research.researched.includes('zpm_interface');
  }

  /**
   * Attempt to install a ZPM.  Sets s.flags.zpmInstalled = true.
   * Returns { ok, reason? }.
   */
  function installZPM(s, logFn) {
    if (!canInstallZPM(s)) {
      return { ok: false, reason: 'ZPM Interface Protocol research is required.' };
    }
    if (s.flags.zpmInstalled) {
      return { ok: false, reason: 'A ZPM is already installed.' };
    }
    s.flags.zpmInstalled = true;
    logFn('benefit', 'Zero Point Module successfully installed in the gate room. Power output is off the charts.');
    return { ok: true };
  }

  // ── Loss Condition ────────────────────────────────────────────────────────

  /**
   * Check loss condition: all personnel dead or off-world and dying.
   * Called from Engine._checkGameOver.
   */
  function checkLoss(s) {
    if (s.personnel.length === 0) return false;
    return s.personnel.every(p => !p.alive);
  }

  // ── Public ───────────────────────────────────────────────────────────────

  return {
    resolveGateDefence,
    canInstallZPM,
    installZPM,
    checkLoss,
    THREATS,
  };

})();
