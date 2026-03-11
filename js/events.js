/**
 * STARGATE: REMNANTS — Event Definitions  (Phase 7)
 *
 * Four event categories:
 *   passive_benefit  — resource windfalls, intel boosts, morale events
 *   passive_threat   — resource drain, personnel damage, debuffs
 *   inbound_gate     — gate activates; player picks a response (pauses game)
 *   scripted         — one-shot story beats keyed to game-progress flags
 *
 * ── Inbound Gate event shape ──────────────────────────────────────────────
 *   responses[]  each: { id, label, alwaysAvailable?, requiresRoom?,
 *                         requiresResearch?, requiresPersonnel?,
 *                         description, resolve(s) → ResolutionResult }
 *
 *   ResolutionResult: { logType, msg, effects }
 *   effects: { resourceDelta?, personnelDamage?, decodingIntel?, grantFlag? }
 *
 * ── Passive event shape ───────────────────────────────────────────────────
 *   weight, minDay, blockedByFlag?, requiresRoom?, requiresFlag?,
 *   effects: same as above
 */

const EVENT_DEFS = Object.freeze({

  // ════════════════════════════════════════════════════════════════
  //  PASSIVE BENEFIT
  // ════════════════════════════════════════════════════════════════

  TRAVELLER_GIFT: {
    id: 'TRAVELLER_GIFT', type: 'passive_benefit', weight: 5,
    title:   'Gate Traveller Gift',
    msg:     'A traveller passed through and left supplies — apparently a common courtesy on civilised worlds.',
    effects: { resourceDelta: { food: 8, medicine: 3 } },
    minDay:  1,
  },

  SUPPLY_CACHE: {
    id: 'SUPPLY_CACHE', type: 'passive_benefit', weight: 11,
    title:   'Supply Cache Discovered',
    msg:     'A hidden cache uncovered during routine maintenance. Previous occupants had good taste.',
    effects: { resourceDelta: { naquadah: 6, alloys: 4, food: 5 } },
    minDay:  2,
  },

  ANCIENT_DATA_BURST: {
    id: 'ANCIENT_DATA_BURST', type: 'passive_benefit', weight: 7,
    title:   'Ancient Data Burst',
    msg:     'The gate briefly activated and transmitted a compressed data burst — Ancient records from an unmapped relay station.',
    effects: { resourceDelta: { data: 12, ancientTech: 1 } },
    minDay:  5,
  },

  MINERAL_SURVEY: {
    id: 'MINERAL_SURVEY', type: 'passive_benefit', weight: 10,
    title:   'Mineral Survey Pays Off',
    msg:     'A survey flag left by a previous team paid dividends. Naquadah seam identified in the surrounding geology.',
    effects: { resourceDelta: { naquadah: 10, crystals: 3 } },
    minDay:  3,
  },

  NOX_VISITOR: {
    id: 'NOX_VISITOR', type: 'passive_benefit', weight: 4,
    title:   'Nox Visitor',
    msg:     'A Nox being appeared briefly in the base — how is unclear — left healing materials and departed without a word.',
    effects: { resourceDelta: { medicine: 10, rarePlants: 5 } },
    minDay:  8,
  },

  TOKRA_INTEL: {
    id: 'TOKRA_INTEL', type: 'passive_benefit', weight: 6,
    title:   "Tok'ra Intelligence Report",
    msg:     "An encrypted message from a Tok'ra contact arrived via gate relay. Intel on Goa'uld movements — and a gate address fragment.",
    effects: { resourceDelta: { data: 8 }, decodingIntel: 'random' },
    minDay:  5,
  },

  ALLY_RESUPPLY: {
    id: 'ALLY_RESUPPLY', type: 'passive_benefit', weight: 8,
    title:   'Allied World Resupply',
    msg:     'P7X-044 sent a supply team through the gate unprompted. The Freemen remember their friends.',
    effects: { resourceDelta: { food: 20, medicine: 6, alloys: 5 } },
    minDay:  12,
    requiresFlag: 'alphaSiteVisited',
  },

  EQUIPMENT_FIND: {
    id: 'EQUIPMENT_FIND', type: 'passive_benefit', weight: 10,
    title:   'Equipment Cache',
    msg:     'A previously overlooked storage room was unsealed. Whoever stocked it had excellent taste in hardware.',
    effects: { resourceDelta: { alloys: 6, crystals: 4, advancedTech: 2 } },
    minDay:  3,
  },

  SCIENCE_BREAKTHROUGH: {
    id: 'SCIENCE_BREAKTHROUGH', type: 'passive_benefit', weight: 8,
    title:   'Lab Breakthrough',
    msg:     'A spontaneous correlation in the research data — someone had an insight on a late shift. Data trove recovered.',
    effects: { resourceDelta: { data: 14 } },
    minDay:  4,
    requiresRoom: 'research_lab',
  },

  SCAVENGE_RUN: {
    id: 'SCAVENGE_RUN', type: 'passive_benefit', weight: 9,
    title:   'Successful Scavenge Run',
    msg:     'Off-duty personnel explored an adjacent section and returned with salvaged components.',
    effects: { resourceDelta: { alloys: 5, naquadah: 3, crystals: 2 } },
    minDay:  2,
  },

  // ════════════════════════════════════════════════════════════════
  //  PASSIVE THREAT
  // ════════════════════════════════════════════════════════════════

  POWER_SURGE: {
    id: 'POWER_SURGE', type: 'passive_threat', weight: 11,
    title:   'Power Surge',
    msg:     'An unexpected power surge damaged the grid. Some equipment is temporarily offline.',
    effects: { resourceDelta: { crystals: -3, advancedTech: -1 } },
    minDay:  1,
  },

  FOOD_SPOILAGE: {
    id: 'FOOD_SPOILAGE', type: 'passive_threat', weight: 11,
    title:   'Food Spoilage',
    msg:     'A refrigeration failure in the mess hall. A portion of the food stores is lost.',
    effects: { resourceDelta: { food: -10 } },
    minDay:  2,
  },

  LAB_ACCIDENT: {
    id: 'LAB_ACCIDENT', type: 'passive_threat', weight: 8,
    title:   'Lab Accident',
    msg:     'A mishap during an unsupervised experiment. One personnel takes minor injuries.',
    effects: { personnelDamage: 18 },
    minDay:  3,
    requiresRoom: 'research_lab',
  },

  JAFFA_PROBE: {
    id: 'JAFFA_PROBE', type: 'passive_threat', weight: 9,
    title:   'Jaffa Surveillance',
    msg:     "Jaffa scouts spotted near the perimeter. They retreated when challenged, but not before transmitting a position fix.",
    effects: { resourceDelta: { data: -6 } },
    minDay:  4,
  },

  EQUIPMENT_FAILURE: {
    id: 'EQUIPMENT_FAILURE', type: 'passive_threat', weight: 10,
    title:   'Equipment Failure',
    msg:     'Critical base equipment has malfunctioned. Repair costs resources.',
    effects: { resourceDelta: { naquadah: -5, alloys: -3 } },
    minDay:  3,
  },

  ILLNESS_OUTBREAK: {
    id: 'ILLNESS_OUTBREAK', type: 'passive_threat', weight: 8,
    title:   'Illness Outbreak',
    msg:     "A pathogen carried from an off-world mission has spread through the team. Medicine depleted treating it.",
    effects: { personnelDamage: 14, resourceDelta: { medicine: -5 } },
    minDay:  4,
  },

  REPLICATOR_FRAGMENT: {
    id: 'REPLICATOR_FRAGMENT', type: 'passive_threat', weight: 5,
    title:   'Replicator Fragment Detected',
    msg:     "A replicator fragment found in an equipment bay — apparently dormant. Destroyed immediately, but not before damaging a data terminal.",
    effects: { resourceDelta: { data: -10, advancedTech: -2 } },
    minDay:  8,
    blockedByFlag: 'replicatorImmunity',
  },

  GOAULD_SABOTAGE: {
    id: 'GOAULD_SABOTAGE', type: 'passive_threat', weight: 7,
    title:   "Goa'uld Sabotage",
    msg:     "Evidence of a planted explosive device — disarmed in time, but gate controls took damage in the sweep.",
    effects: { resourceDelta: { crystals: -5, data: -8 } },
    minDay:  6,
  },

  SUPPLY_AMBUSH: {
    id: 'SUPPLY_AMBUSH', type: 'passive_threat', weight: 8,
    title:   'Supply Interception',
    msg:     'A returning supply party was ambushed near the perimeter. They made it back; most of what they carried did not.',
    effects: { personnelDamage: 20, resourceDelta: { food: -7, alloys: -4 } },
    minDay:  5,
  },

  NAQUADAH_LEAK: {
    id: 'NAQUADAH_LEAK', type: 'passive_threat', weight: 7,
    title:   'Naquadah Storage Leak',
    msg:     'A storage container ruptured. Naquadah contamination was contained, but the losses are significant.',
    effects: { resourceDelta: { naquadah: -12 } },
    minDay:  3,
  },

  // ════════════════════════════════════════════════════════════════
  //  INBOUND GATE EVENTS
  //  resolve(s) returns { logType, msg, effects }
  // ════════════════════════════════════════════════════════════════

  JAFFA_INCURSION: {
    id: 'JAFFA_INCURSION', type: 'inbound_gate', weight: 14,
    minDay:  3,
    urgent:  true,
    title:   'Jaffa Incursion',
    description: "GATE ACTIVATED — UNSCHEDULED INCOMING WORMHOLE. Energy signature matches Jaffa origin point. Armed hostiles expected. Standing by for orders.",
    responses: [
      {
        id: 'close_iris',
        label: '⛨  Close Iris',
        alwaysAvailable: true,
        description: 'Seal the iris. Incoming matter is destroyed on contact. Zero risk to personnel — but no salvage.',
        resolve(s) {
          const hasShield = s.research.researched.includes('gate_shield_protocols');
          if (hasShield) {
            return {
              logType: 'info',
              msg: "Iris sealed. Gate Shield Protocols at full efficiency. Jaffa matter stream terminated on contact. No breach.",
              effects: {},
            };
          }
          return {
            logType: 'danger',
            msg: "Iris closed. Jaffa shredded on contact. Iris mechanism took minor wear without Gate Shield Protocols installed.",
            effects: { resourceDelta: { crystals: -2 } },
          };
        },
      },
      {
        id: 'defend',
        label: '⚔  Intercept Team',
        requiresPersonnel: true,
        description: 'Station defenders in the gate room. High risk — but you may capture weapons, armour, or a prisoner for intel.',
        resolve(s) {
          const defenders = s.personnel.filter(p => p.alive && !p.offWorld);
          if (!defenders.length) {
            return { logType: 'danger', msg: 'No defenders available.', effects: {} };
          }
          return Combat.resolveGateDefence(s, defenders, 'jaffa', 'medium');
        },
      },
      {
        id: 'let_through',
        label: '🤝  Allow Contact',
        alwaysAvailable: true,
        description: "Open the base to whoever is coming. Odds favour hostiles. If they are allies, rewards are significant.",
        resolve(s) {
          if (Math.random() < 0.70) {
            const diff = CONFIG.DIFFICULTY[s.difficulty]?.combatDamageMultiplier ?? 1.0;
            s.personnel.filter(p => p.alive && !p.offWorld).forEach(p => {
              if (Math.random() < 0.45) {
                const dmg = Math.round((15 + Math.random() * 25) * diff);
                p.health = Math.max(0, p.health - dmg);
                if (p.health === 0) p.alive = false;
              }
            });
            return {
              logType: 'danger',
              msg: "Jaffa warriors emerged from the gate. Base breached — personnel took casualties. Hostiles eventually driven off.",
              effects: { resourceDelta: { food: -6, medicine: -4 } },
            };
          }
          return {
            logType: 'benefit',
            msg: "The arrivals were not Jaffa — a lost team of free Jaffa seeking sanctuary. They brought what they had.",
            effects: { resourceDelta: { food: 10, medicine: 5, data: 6 }, decodingIntel: 'random' },
          };
        },
      },
    ],
  },

  REPLICATOR_INCURSION: {
    id: 'REPLICATOR_INCURSION', type: 'inbound_gate', weight: 7,
    minDay:  10,
    urgent:  true,
    blockedByFlag: 'replicatorImmunity',
    title:   'Replicator Incursion',
    description: "GATE ACTIVATED — REPLICATOR ENERGY SIGNATURE DETECTED. Spider-form blocks inbound. Recommend immediate containment. Do NOT allow base penetration.",
    responses: [
      {
        id: 'close_iris',
        label: '⛨  Close Iris',
        alwaysAvailable: true,
        description: 'Seal the iris. Destroy the replicator stream before it enters the base.',
        resolve(s) {
          const hasShield = s.research.researched.includes('gate_shield_protocols');
          if (hasShield) {
            return {
              logType: 'info',
              msg: "Iris engaged. Gate Shield Protocols held. Replicator stream terminated. No breach.",
              effects: {},
            };
          }
          const diff = CONFIG.DIFFICULTY[s.difficulty]?.combatDamageMultiplier ?? 1.0;
          s.personnel.filter(p => p.alive && !p.offWorld).forEach(p => {
            if (Math.random() < 0.30) {
              const dmg = Math.round((8 + Math.random() * 12) * diff);
              p.health = Math.max(0, p.health - dmg);
              if (p.health === 0) p.alive = false;
            }
          });
          return {
            logType: 'danger',
            msg: "Iris engaged but replicator fragments penetrated before it sealed. Units entered the base — destroyed, but equipment and personnel suffered.",
            effects: { resourceDelta: { data: -8, crystals: -4 } },
          };
        },
      },
      {
        id: 'emp_blast',
        label: '⚡  EMP Discharge',
        requiresResearch: 'perimeter_sensors',
        description: 'Fire an EMP burst at the gate mouth. Disables electronics — including replicators. Requires Perimeter Sensors.',
        resolve(s) {
          return {
            logType: 'benefit',
            msg: "EMP discharge fires at the gate mouth. Replicator stream fried mid-transit. Gate electronics need recalibration — zero penetration.",
            effects: { resourceDelta: { power: -3, crystals: -2 } },
          };
        },
      },
      {
        id: 'capture_fragment',
        label: '🔬  Capture Fragment',
        requiresResearch: 'xenobiology',
        description: 'Allow one unit through into a containment field for study. Enormous risk. Enormous potential reward.',
        resolve(s) {
          if (Math.random() < 0.40) {
            s.flags.replicatorsKnown = true;
            return {
              logType: 'benefit',
              msg: "Fragment contained. Nanite behaviour patterns documented. This data on replicator vulnerabilities is invaluable.",
              effects: { resourceDelta: { naniteTech: 2, data: 15 }, grantFlag: 'replicatorsKnown' },
            };
          }
          const dead = [];
          const diff = CONFIG.DIFFICULTY[s.difficulty]?.combatDamageMultiplier ?? 1.0;
          s.personnel.filter(p => p.alive && !p.offWorld).forEach(p => {
            if (Math.random() < 0.55) {
              const dmg = Math.round((20 + Math.random() * 30) * diff);
              p.health = Math.max(0, p.health - dmg);
              if (p.health === 0) { p.alive = false; dead.push(p.name); }
            }
          });
          return {
            logType: 'danger',
            msg: `Containment failed. Replicator blocks spread through equipment bays before being destroyed.${dead.length ? ' ' + dead.join(', ') + ' KIA.' : ' No fatalities — barely.'}`,
            effects: { resourceDelta: { advancedTech: -5, data: -10 } },
          };
        },
      },
    ],
  },

  FRIENDLY_REFUGEES: {
    id: 'FRIENDLY_REFUGEES', type: 'inbound_gate', weight: 11,
    minDay:  4,
    urgent:  false,
    title:   'Refugees at the Gate',
    description: "GATE ACTIVATED — UNSCHEDULED INCOMING. Preliminary scans indicate unarmed civilians. Address matches a world under Goa'uld occupation. Standing by.",
    responses: [
      {
        id: 'welcome',
        label: '🤝  Welcome Them',
        alwaysAvailable: true,
        description: 'Open the base to refugees. They will consume food, but may bring knowledge, skills — or gratitude.',
        resolve(s) {
          if (!Resources.canAfford(s, { food: 8 })) {
            return {
              logType: 'danger',
              msg: "Refugees admitted but food stores were already critically low. The situation is worse.",
              effects: { resourceDelta: { food: -4 } },
            };
          }
          Resources.spend(s, { food: 8 });
          if (Math.random() < 0.5) {
            return {
              logType: 'benefit',
              msg: "Refugees welcomed. They shared intelligence on Goa'uld patrol routes and supplies they'd salvaged.",
              effects: { resourceDelta: { data: 8, medicine: 4 } },
            };
          }
          return {
            logType: 'benefit',
            msg: "Refugees welcomed. They carried artefacts from their world — and news of another gate address.",
            effects: { resourceDelta: { artifacts: 3, alloys: 3 }, decodingIntel: 'random' },
          };
        },
      },
      {
        id: 'screen_assist',
        label: '📋  Screen & Assist',
        requiresRoom: 'med_bay',
        description: 'Run medical screening and assist the most critical cases, then redirect them to a safer world.',
        resolve(s) {
          return {
            logType: 'info',
            msg: "Refugees screened — no infiltration. Medical care provided. Sent to P7X-044 with an introduction. Intel gathered.",
            effects: { resourceDelta: { medicine: -4, data: 7, food: -3 } },
          };
        },
      },
      {
        id: 'turn_away',
        label: '✕  Turn Away',
        alwaysAvailable: true,
        description: 'The base cannot support additional personnel. Redirect them.',
        resolve(s) {
          return {
            logType: 'neutral',
            msg: "Refugees redirected. Hard call. The team's mood has taken a quiet, unspoken hit.",
            effects: {},
          };
        },
      },
    ],
  },

  GOAULD_ENVOY: {
    id: 'GOAULD_ENVOY', type: 'inbound_gate', weight: 7,
    minDay:  8,
    urgent:  true,
    title:   "Goa'uld Envoy",
    description: "GATE ACTIVATED — ENERGY SIGNATURE MATCHES GOA'ULD MOTHERSHIP RELAY. An armoured Jaffa herald has stepped through bearing terms. They demand tribute — or retribution.",
    responses: [
      {
        id: 'refuse_fight',
        label: '⚔  Refuse and Fight',
        alwaysAvailable: true,
        description: "Send the herald back in pieces. Escalates Goa'uld aggression but demonstrates strength.",
        resolve(s) {
          return Combat.resolveGateDefence(
            s,
            s.personnel.filter(p => p.alive && !p.offWorld),
            'goauld_envoy', 'low'
          );
        },
      },
      {
        id: 'negotiate',
        label: '🤝  Negotiate Terms',
        requiresResearch: 'diplomatic_protocols',
        description: "Attempt to stall with counter-demands. Requires Diplomatic Protocols research.",
        resolve(s) {
          if (Math.random() < 0.60) {
            return {
              logType: 'benefit',
              msg: "Envoy departed with a counter-offer. The System Lord is intrigued rather than outraged — for now.",
              effects: { resourceDelta: { data: 10 }, decodingIntel: 'random' },
            };
          }
          return {
            logType: 'danger',
            msg: "Negotiations collapsed. The envoy left promising retribution. A punitive raid followed within hours.",
            effects: { personnelDamage: 22, resourceDelta: { food: -8, naquadah: -5 } },
          };
        },
      },
      {
        id: 'pay_tribute',
        label: '💰  Pay Tribute',
        alwaysAvailable: true,
        description: 'Hand over what they demand. Humiliating — but buys temporary peace.',
        resolve(s) {
          const tribute = { naquadah: 15, food: 10 };
          const canPay  = Resources.canAfford(s, tribute);
          if (canPay) Resources.spend(s, tribute);
          return {
            logType: canPay ? 'neutral' : 'danger',
            msg: canPay
              ? "Tribute paid. The herald departed satisfied. They will be back — they always come back."
              : "Insufficient tribute. The Goa'uld withdrew insulted. The slight will not be forgotten.",
            effects: canPay ? {} : { personnelDamage: 18 },
          };
        },
      },
    ],
  },

  MYSTERY_SIGNAL: {
    id: 'MYSTERY_SIGNAL', type: 'inbound_gate', weight: 10,
    minDay:  5,
    urgent:  false,
    title:   'Unknown Gate Signal',
    description: "GATE ACTIVATED — UNIDENTIFIED ENERGY SIGNATURE. Origin does not match any catalogued address. Anomalous signal pattern. Could be Ancient, could be something else entirely.",
    responses: [
      {
        id: 'open_channel',
        label: '📡  Open Channel',
        alwaysAvailable: true,
        description: 'Allow the connection and see who — or what — is on the other side.',
        resolve(s) {
          const roll = Math.random();
          if (roll < 0.30) {
            return {
              logType: 'benefit',
              msg: "An Ancient automated relay station pinged back after centuries. Data package received — gate address fragments and schematics.",
              effects: { resourceDelta: { data: 18, ancientTech: 2 }, decodingIntel: 'random' },
            };
          }
          if (roll < 0.55) {
            return {
              logType: 'benefit',
              msg: "A free Jaffa outpost seeking allies. Exchange of encrypted coordinates — mutual recognition established.",
              effects: { resourceDelta: { alloys: 8, naquadah: 6 } },
            };
          }
          if (roll < 0.80) {
            return {
              logType: 'danger',
              msg: "The signal was a Goa'uld probe. It transmitted base layout before being shut down. Expect increased attention.",
              effects: { resourceDelta: { data: -5 } },
            };
          }
          return {
            logType: 'neutral',
            msg: "A wormhole dropout from a damaged gate somewhere in the galaxy. Static, then silence. The gate closed itself.",
            effects: {},
          };
        },
      },
      {
        id: 'analyse_first',
        label: '🔬  Analyse Signal',
        requiresRoom: 'research_lab',
        description: 'Run a spectral analysis before responding. Safer — and you may intercept useful data.',
        resolve(s) {
          return {
            logType: 'benefit',
            msg: "Signal analysed: Ancient carrier wave on Milky Way gate protocols. Safe to respond. Data intercepted during analysis.",
            effects: { resourceDelta: { data: 12, ancientTech: 1 } },
          };
        },
      },
      {
        id: 'close_iris',
        label: '⛨  Close Iris',
        alwaysAvailable: true,
        description: 'Seal the iris and let the connection time out. Safe — leaves questions unanswered.',
        resolve(s) {
          return {
            logType: 'neutral',
            msg: "Iris sealed. Signal timed out. Whatever was on the other side was left wondering.",
            effects: {},
          };
        },
      },
    ],
  },

  EARTH_SIGNAL: {
    id: 'EARTH_SIGNAL', type: 'inbound_gate', weight: 3,
    minDay:  15,
    oneShot: true,
    urgent:  false,
    title:   'Earth Carrier Signal — Partial',
    description: "GATE ACTIVATED — PARTIAL SIGNAL ON EARTH'S CARRIER FREQUENCY. Only one-way data transfer possible before the wormhole collapses. Earth may not know you are here.",
    responses: [
      {
        id: 'transmit_status',
        label: '📡  Transmit Status Report',
        alwaysAvailable: true,
        description: "Jam as much operational data through as possible before the window closes.",
        resolve(s) {
          return {
            logType: 'benefit',
            msg: "Status report transmitted. Partial acknowledgement received — encrypted. SGC may be aware of your position.",
            effects: { resourceDelta: { data: 5 }, grantFlag: 'earthContactAttempted' },
          };
        },
      },
      {
        id: 'receive_only',
        label: '📥  Listen Only',
        alwaysAvailable: true,
        description: "Do not transmit. Receive whatever data comes through.",
        resolve(s) {
          return {
            logType: 'benefit',
            msg: "Data package received — automated SGC mission protocols and gate address indices. Not everything, but significant.",
            effects: { resourceDelta: { data: 22, ancientTech: 1 } },
          };
        },
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  //  SCRIPTED EVENTS — one-shot story beats
  // ════════════════════════════════════════════════════════════════

  FIRST_OFFWORLD: {
    id:   'FIRST_OFFWORLD',
    type: 'scripted',
    triggerCondition: (s) => s.worlds.some(w => w.visited) && !s.flags.alphaFound,
    title: 'First Steps',
    msg:   "The team has stepped through the gate for the first time. Something about standing on alien soil — the mission became real today.",
    effects: { grantFlag: 'alphaFound' },
    priority: 1,
  },

  PEGASUS_ADDRESS_FOUND: {
    id:   'PEGASUS_ADDRESS_FOUND',
    type: 'scripted',
    triggerCondition: (s) => s.flags.pegasusAddressKnown && !s.flags.pegasusAddressAnnounced,
    title: 'Pegasus Address Confirmed',
    msg:   "Anquietas has yielded the Pegasus gate address. You know where you need to go. Now you need the power to get there — a ZPM must be found and installed.",
    effects: { grantFlag: 'pegasusAddressAnnounced' },
    priority: 2,
  },

  ZPM_INTERFACE_READY: {
    id:   'ZPM_INTERFACE_READY',
    type: 'scripted',
    triggerCondition: (s) => s.flags.zpmInterfaceResearched && !s.flags.zpmInterfaceAnnounced,
    title: 'ZPM Interface Online',
    msg:   "ZPM Interface Protocol research complete. A Zero Point Module, if found, can now be installed in the gate room. Find one. That is the last step.",
    effects: { grantFlag: 'zpmInterfaceAnnounced' },
    priority: 3,
  },

  WIN_CONDITION_NEAR: {
    id:   'WIN_CONDITION_NEAR',
    type: 'scripted',
    triggerCondition: (s) => s.flags.zpmInstalled && s.flags.pegasusAddressKnown && !s.flags.gameWon,
    title: 'Pegasus Within Reach',
    msg:   "ZPM installed. Pegasus address confirmed. The gate is ready. When you dial that address, the mission ends — and a new chapter begins. No pressure.",
    effects: {},
    priority: 10,
  },

});

// ── Helpers ──────────────────────────────────────────────────────────────────

/** All passive events (benefit + threat). */
function getPassiveEvents() {
  return Object.values(EVENT_DEFS).filter(e =>
    e.type === 'passive_benefit' || e.type === 'passive_threat'
  );
}

/** All inbound gate events. */
function getInboundEvents() {
  return Object.values(EVENT_DEFS).filter(e => e.type === 'inbound_gate');
}

/** All scripted events ordered by priority. */
function getScriptedEvents() {
  return Object.values(EVENT_DEFS)
    .filter(e => e.type === 'scripted')
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
}


/**
 * STARGATE: REMNANTS — Events Module  (Phase 7)
 *
 * Orchestrates all four event categories defined in data/events.js:
 *   1. Passive events   — processed in the engine tick, no UI pause
 *   2. Inbound gate     — renders full-screen overlay, pauses game, player responds
 *   3. Scripted events  — one-shot story beats checked each day
 *   4. Win / Loss       — triggers game-over screens
 *
 * Engine integration:
 *   Engine calls Events.tickPassive(s, logFn)    — each tick
 *   Engine calls Events.checkScripted(s, logFn)  — each day
 *   Engine calls Events.checkGameOver(s, logFn)  — each tick
 *   Events.showInboundOverlay(def, s, logFn)     — triggered from engine
 *
 * State fields used/written:
 *   s.activeEvent         — { id, type } | null
 *   s.events.firedOneShot — string[]      — ids of one-shot events already fired
 *   s.paused              — set true while overlay is open
 */

const Events = (() => {

  // ── Weighted random pick ──────────────────────────────────────────────────

  function _weightedPick(pool) {
    const total = pool.reduce((a, e) => a + (e.weight ?? 1), 0);
    let roll    = Math.random() * total;
    for (const evt of pool) {
      roll -= (evt.weight ?? 1);
      if (roll <= 0) return evt;
    }
    return pool[pool.length - 1];
  }

  // ── State helpers ─────────────────────────────────────────────────────────

  function _ensureEventsState(s) {
    if (!s.events) {
      s.events = { firedOneShot: [], gateTrips: 0 };
    }
    if (s.events.gateTrips === undefined) s.events.gateTrips = 0;
  }

  function _hasRoom(s, type) {
    return s.rooms.some(r => r.type === type && !r.constructing);
  }

  function _hasResearch(s, id) {
    return s.research.researched.includes(id);
  }

  // ── Apply effect object ───────────────────────────────────────────────────

  /**
   * Apply a resolution effect bundle to state.
   * @param {GameState} s
   * @param {{ resourceDelta?, personnelDamage?, decodingIntel?, grantFlag? }} effects
   * @param {Function} logFn
   */
  function applyEffects(s, effects, logFn) {
    if (!effects) return;

    // Resource changes
    if (effects.resourceDelta) {
      Object.entries(effects.resourceDelta).forEach(([k, v]) => {
        if (v !== 0) Resources.add(s, k, v);
      });
    }

    // Personnel damage — hits a random on-base, alive person
    if (effects.personnelDamage && effects.personnelDamage > 0) {
      const targets = s.personnel.filter(p => p.alive && !p.offWorld);
      if (targets.length > 0) {
        const diff = CONFIG.DIFFICULTY[s.difficulty]?.combatDamageMultiplier ?? 1.0;
        const p    = targets[Math.floor(Math.random() * targets.length)];
        const dmg  = Math.round(effects.personnelDamage * diff);
        p.health   = Math.max(0, p.health - dmg);
        if (p.health === 0) p.alive = false;
        logFn('danger', `${p.name} took ${dmg} damage${p.alive ? '' : ' — KIA'}.`);
      }
    }

    // Decoding intel grant
    if (effects.decodingIntel) {
      const locked = PLANET_DB.filter(def => {
        const rec = s.decoding?.[def.id];
        return !def.decoded && rec && rec.state !== 'decoded';
      });
      if (locked.length > 0) {
        const target = locked[Math.floor(Math.random() * locked.length)];
        Decoding.grantMissionIntel(s, target.id, logFn);
      }
    }

    // Grant a flag
    if (effects.grantFlag) {
      s.flags[effects.grantFlag] = true;
    }
  }

  // ── PASSIVE EVENTS ────────────────────────────────────────────────────────

  /**
   * Called every tick. May fire one passive event.
   * Replaces engine.js _maybeRandomEvent.
   */
  function tickPassive(s, logFn) {
    if (s.activeEvent) return;   // don't stack events
    if (s.offWorld)    return;   // no random events while off-world
    if (Math.random() > CONFIG.RANDOM_EVENT_CHANCE_PER_TICK) return;

    _ensureEventsState(s);

    // Build eligible pool
    const pool = getPassiveEvents().filter(def => {
      if ((def.minDay ?? 0) > s.day) return false;
      if (def.blockedByFlag && s.flags[def.blockedByFlag]) return false;
      if (def.requiresRoom  && !_hasRoom(s, def.requiresRoom))  return false;
      if (def.requiresFlag  && !s.flags[def.requiresFlag])       return false;
      return true;
    });

    // Also include legacy decoding intel micro-events at 30% bleed-in
    const locked = PLANET_DB.filter(d => {
      const rec = s.decoding?.[d.id];
      return !d.decoded && rec && rec.state !== 'decoded';
    });

    let finalPool = pool;
    if (locked.length > 0 && Math.random() < 0.25) {
      // Pick a random locked world and build a mini-event for it
      const world = locked[Math.floor(Math.random() * locked.length)];
      const decodingMini = {
        id: `DECODING_${world.id}`,
        type: 'passive_benefit',
        weight: 2,
        title: 'Gate Traveller Mention',
        msg: `A gate traveller mentioned hearing about a world with ${world.biome} terrain. Intel filed.`,
        effects: { decodingIntel: world.id },
      };
      finalPool = [...pool, decodingMini, decodingMini];  // double weight
    }

    if (!finalPool.length) return;

    const evt = _weightedPick(finalPool);
    if (!evt) return;

    // Danger event reduction from perimeter_sensors research
    if (evt.type === 'passive_threat') {
      const reduction = Research.sumEffect(s, 'dangerEventReduc');
      if (reduction > 0 && Math.random() < reduction) {
        logFn('info', `Early warning system detected and averted a threat — Perimeter Sensors active.`);
        return;
      }
    }

    // Goa'uld event reduction from omega_protocol
    if (evt.id === 'GOAULD_SABOTAGE' || evt.id === 'JAFFA_PROBE') {
      const reduction = Research.sumEffect(s, 'goauldEventReduction');
      if (reduction > 0 && Math.random() < reduction) {
        logFn('info', `Omega Protocol deterrence — Goa'uld activity deflected.`);
        return;
      }
    }

    logFn(evt.type === 'passive_benefit' ? 'benefit' : 'danger', `[${evt.title}] ${evt.msg}`);
    applyEffects(s, evt.effects, logFn);
    // Phase 8: Audio hook
    if (typeof Audio !== 'undefined') Audio.onEvent(evt.type === 'passive_benefit' ? 'benefit' : 'danger');
  }

  // ── INBOUND GATE EVENTS ───────────────────────────────────────────────────

  /**
   * Called once per day. May trigger one inbound gate event.
   * Returns true if an event was triggered.
   */
  function maybeInboundGate(s, logFn) {
    if (s.activeEvent) return false;                     // already one pending
    if (s.offWorld)    return false;                     // team is through the gate
    // Base 8% chance, +1.5% per completed gate trip, capped at 30%
    const trips        = s.events?.gateTrips ?? 0;
    const inboundChance = Math.min(0.08 + trips * 0.015, 0.30);
    if (Math.random() > inboundChance) return false;

    _ensureEventsState(s);

    const pool = getInboundEvents().filter(def => {
      if ((def.minDay ?? 0) > s.day) return false;
      if (def.blockedByFlag && s.flags[def.blockedByFlag]) return false;
      if (def.oneShot && s.events.firedOneShot.includes(def.id)) return false;
      return true;
    });

    if (!pool.length) return false;

    const def = _weightedPick(pool);
    if (!def) return false;

    if (def.oneShot) s.events.firedOneShot.push(def.id);

    // Pause game and show the overlay
    s.activeEvent = { id: def.id, type: 'inbound_gate' };
    s.paused      = true;

    logFn(def.urgent ? 'danger' : 'alert',
      `⚠ INBOUND GATE EVENT — ${def.title}. Awaiting player response.`
    );

    // Phase 8: Audio alert
    if (typeof Audio !== 'undefined') Audio.onEvent('alert');

    showInboundOverlay(def, s, logFn);
    return true;
  }

  // ── INBOUND GATE OVERLAY UI ───────────────────────────────────────────────

  let _pendingLogFn = null;

  /**
   * Render the inbound gate event overlay and wire up response buttons.
   */
  function showInboundOverlay(def, s, logFn) {
    _pendingLogFn = logFn;

    const overlay = document.getElementById('event-overlay');
    const box     = document.getElementById('event-box');
    if (!overlay || !box) return;

    // Determine which responses are available
    const responses = def.responses.map(r => {
      let locked   = false;
      let lockMsg  = '';

      if (r.requiresRoom && !_hasRoom(s, r.requiresRoom)) {
        locked  = true;
        const base = Base?.ROOMS?.[r.requiresRoom];
        lockMsg = `Requires ${base?.label ?? r.requiresRoom}`;
      }
      if (r.requiresResearch && !_hasResearch(s, r.requiresResearch)) {
        locked  = true;
        const rDef = typeof RESEARCH_DEFS !== 'undefined' ? RESEARCH_DEFS[r.requiresResearch] : null;
        lockMsg = `Requires research: ${rDef?.label ?? r.requiresResearch}`;
      }
      if (r.requiresPersonnel) {
        const avail = s.personnel.filter(p => p.alive && !p.offWorld).length;
        if (avail === 0) {
          locked  = true;
          lockMsg = 'No personnel on base';
        }
      }

      return { ...r, locked, lockMsg };
    });

    const urgentClass  = def.urgent ? 'event-urgent' : '';
    const urgentBadge  = def.urgent
      ? `<div class="event-alert-badge">⚠ ALERT</div>`
      : `<div class="event-alert-badge event-badge-info">◉ GATE ACTIVITY</div>`;

    box.dataset.type = def.urgent ? 'danger' : 'gate';

    box.innerHTML = `
      <div class="event-header ${urgentClass}">
        ${urgentBadge}
        <div class="event-title">${def.title}</div>
        <div class="event-description">${def.description}</div>
      </div>

      <div class="event-responses">
        ${responses.map(r => `
          <div class="event-response ${r.locked ? 'event-response-locked' : ''}"
               onclick="${r.locked ? '' : `Events.respondToEvent('${def.id}','${r.id}')`}">
            <div class="event-response-label">${r.label}</div>
            <div class="event-response-desc">${r.locked ? `<span class="event-lock">🔒 ${r.lockMsg}</span>` : r.description}</div>
          </div>
        `).join('')}
      </div>
    `;

    overlay.classList.add('active');

    // Pulse the event overlay in the header
    _setGateAlertPulse(true, def.urgent);
  }

  /**
   * Called when the player clicks a response button.
   * Resolves the event, applies effects, closes the overlay.
   */
  function respondToEvent(eventId, responseId) {
    const s = State.get();
    if (!s) return;

    const def      = EVENT_DEFS[eventId];
    const response = def?.responses?.find(r => r.id === responseId);
    if (!def || !response) return;

    // Resolve the response
    const result = response.resolve(s);

    // Apply effects
    const logFn = _pendingLogFn ?? ((type, msg) => Engine.log(type, msg));
    logFn(result.logType, `[${def.title}] ${result.msg}`);
    applyEffects(s, result.effects, logFn);

    // Phase 8: Audio — play success/failure based on combat result logType
    if (typeof Audio !== 'undefined') {
      if (result.logType === 'success') Audio.onCombat(true);
      else if (result.logType === 'danger') Audio.onCombat(false);
    }

    // Update personnel screen if visible
    if (s.ui.currentScene === 'personnel') Personnel.renderScreen(s, null);

    // Clear event state and unpause
    s.activeEvent = null;
    s.paused      = false;
    _pendingLogFn = null;

    // Close overlay
    const overlay = document.getElementById('event-overlay');
    if (overlay) overlay.classList.remove('active');
    _setGateAlertPulse(false, false);

    // Refresh UI
    UI.updateResourceDisplay(s);

    // Check game-over immediately (combat may have killed personnel)
    checkGameOver(s, logFn);
  }

  function _setGateAlertPulse(active, urgent) {
    const btn = document.getElementById('event-alert-btn');
    if (!btn) return;
    btn.style.display = active ? 'block' : 'none';
    btn.classList.toggle('event-alert-urgent', urgent);
  }

  // ── SCRIPTED EVENTS ───────────────────────────────────────────────────────

  /**
   * Called once per day. Fires any scripted events whose conditions are met.
   */
  function checkScripted(s, logFn) {
    _ensureEventsState(s);
    getScriptedEvents().forEach(def => {
      if (s.events.firedOneShot?.includes(def.id)) return;
      try {
        if (!def.triggerCondition(s)) return;
      } catch (e) {
        return;
      }
      // Fire it
      s.events.firedOneShot.push(def.id);
      logFn('benefit', `📌 ${def.title} — ${def.msg}`);
      applyEffects(s, def.effects, logFn);

      // Show a prominent notification for story beats
      if (typeof UI !== 'undefined') {
        UI.showNotification(def.title, 'benefit');
      }
    });
  }

  // ── WIN / LOSS GAME OVER ──────────────────────────────────────────────────

  /**
   * Check both win and loss conditions.
   * Calls UI.showGameOver and stops engine if triggered.
   * Returns 'win' | 'loss' | null.
   */
  function checkGameOver(s, logFn) {
    if (s.flags.gameWon || s.flags.gameLost) return null;

    // LOSS: all personnel dead
    if (Combat.checkLoss(s)) {
      s.flags.gameLost = true;
      logFn('danger', '▸ All personnel lost. The base has gone silent. Mission failed.');
      _showGameOverScreen(s, false, logFn);
      return 'loss';
    }

    // WIN: ZPM installed + Pegasus address known
    if (s.flags.zpmInstalled && s.flags.pegasusAddressKnown) {
      s.flags.gameWon = true;
      logFn('benefit', '▸ ZPM powered. Pegasus address confirmed. The gate is dialing. Mission complete.');
      _showGameOverScreen(s, true, logFn);
      return 'win';
    }

    return null;
  }

  /**
   * Build and show the game-over screen with stats.
   */
  function _showGameOverScreen(s, won, logFn) {
    // Stop engine first
    Engine.stop();

    const el    = document.getElementById('game-over-screen');
    const title = document.getElementById('game-over-title');
    const msg   = document.getElementById('game-over-msg');
    const stats = document.getElementById('game-over-stats');
    if (!el) return;

    // Titles and messages
    if (won) {
      if (title) title.textContent  = 'MISSION COMPLETE';
      if (title) title.className    = 'game-over-title-win';
      if (msg)   msg.innerHTML = `
        <p>The Stargate pulses with power drawn from a ZPM charged over a million years.</p>
        <p>Seven chevrons lock. The kawoosh erupts — not the familiar blue-white ring, but something brighter, vast.</p>
        <p>The wormhole to Pegasus holds open. Your team steps through.</p>
        <p>You kept the light on. Whatever comes next — it begins here.</p>
      `;
    } else {
      if (title) title.textContent  = 'ALL PERSONNEL LOST';
      if (title) title.className    = 'game-over-title-loss';
      if (msg)   msg.innerHTML = `
        <p>The base has fallen silent. Systems power down one by one in the dark.</p>
        <p>There are no more personnel to carry the mission forward.</p>
        <p>The gate room is empty. The gate still stands — patient, indifferent, eternal.</p>
        <p>Their sacrifice will not be forgotten.</p>
      `;
    }

    // Build stats
    if (stats) {
      const alive      = s.personnel.filter(p => p.alive).length;
      const totalPers  = s.personnel.length;
      const researched = s.research.researched.length;
      const itemCount  = s.items.length;
      const roomCount  = s.rooms.filter(r => !r.constructing).length;
      const worldsVis  = s.worlds.filter(w => w.visited).length;

      stats.innerHTML = `
        <div class="go-stats-grid">
          <div class="go-stat"><span class="go-stat-label">Days Survived</span><span class="go-stat-val">${s.day}</span></div>
          <div class="go-stat"><span class="go-stat-label">Personnel ${won ? 'Alive' : 'Surviving'}</span><span class="go-stat-val">${alive} / ${totalPers}</span></div>
          <div class="go-stat"><span class="go-stat-label">Worlds Visited</span><span class="go-stat-val">${worldsVis}</span></div>
          <div class="go-stat"><span class="go-stat-label">Research Complete</span><span class="go-stat-val">${researched}</span></div>
          <div class="go-stat"><span class="go-stat-label">Items Crafted</span><span class="go-stat-val">${itemCount}</span></div>
          <div class="go-stat"><span class="go-stat-label">Rooms Built</span><span class="go-stat-val">${roomCount}</span></div>
          ${s.flags.pegasusAddressKnown ? '<div class="go-stat go-stat-milestone"><span class="go-stat-label">Pegasus Address</span><span class="go-stat-val">✓ Found</span></div>' : ''}
          ${s.flags.zpmInstalled        ? '<div class="go-stat go-stat-milestone"><span class="go-stat-label">ZPM Installed</span><span class="go-stat-val">✓</span></div>' : ''}
        </div>
      `;
    }

    // Show the screen
    if (typeof UI !== 'undefined') UI.showScreen('game-over-screen');
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    tickPassive,
    maybeInboundGate,
    checkScripted,
    checkGameOver,
    respondToEvent,
    applyEffects,
    showInboundOverlay,
  };

})();
