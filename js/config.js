/**
 * STARGATE: REMNANTS — Configuration
 * All key game parameters grouped here for easy tweaking.
 */

const CONFIG = Object.freeze({

  // ─── Meta ────────────────────────────────────────────────────────────────
  VERSION: '0.8.0',
  GAME_TITLE: 'Stargate: Remnants',

  // ─── Time ────────────────────────────────────────────────────────────────
  /** Real-world milliseconds per in-game hour */
  HOUR_DURATION_MS: 5000,
  /** In-game hours per day */
  HOURS_PER_DAY: 24,

  // ─── Save / Load ─────────────────────────────────────────────────────────
  SAVE_SLOTS: 3,
  /** Autosave interval in real-world milliseconds */
  AUTOSAVE_INTERVAL_MS: 30000,
  SAVE_KEY_PREFIX: 'sgr_save_',

  // ─── Resources ───────────────────────────────────────────────────────────
  DEFAULT_RESOURCE_LIMIT: 150,
  STARTING_RESOURCES: {
    // Primary — enough for ~6 days and 1–2 early buildings
    naquadah:    35,   // comfortable buffer for 1–2 early buildings
    food:        30,   // ~6 days for starting crew; creates early pressure for foraging
    power:       15,   // buffer before power deficit hits
    data:        12,   // below cheapest research cost — must build lab first
    // Secondary — small seed amounts; must be earned through missions
    artifacts:    1,
    alloys:       6,
    crystals:     3,
    medicine:     5,
    rarePlants:   2,
    // Tertiary — zero; only available from specific off-world locations
    advancedTech:  0,
    ancientTech:   0,
    naniteTech:    0,
  },
  /** Base generates this much power per tick without any rooms */
  DEFAULT_POWER_GENERATION: 1,

  // ─── Personnel ───────────────────────────────────────────────────────────
  MAX_STAT_LEVEL: 10,
  /** In-game hours to increase one stat by 1 */
  TRAINING_HOURS_PER_LEVEL: 24,
  /** In-game hours to construct a room */
  BUILD_HOURS: 2,
  MAX_TEAM_SIZE: 4,

  // ─── Difficulty Modifiers ────────────────────────────────────────────────
  DIFFICULTY: {
    easy:   { missionSuccessBonus: 0.20, combatDamageMultiplier: 0.75, resourceMultiplier: 1.25 },
    normal: { missionSuccessBonus: 0.00, combatDamageMultiplier: 1.00, resourceMultiplier: 1.00 },
    hard:   { missionSuccessBonus: -0.20, combatDamageMultiplier: 1.50, resourceMultiplier: 0.75 },
  },

  // ─── Theme & Typography ──────────────────────────────────────────────────
  THEME: {
    colorBg:           '#060b14',
    colorSurface:      '#0b1628',
    colorPanel:        '#0f1e35',
    colorBorder:       '#1c3558',
    colorAccentCyan:   '#0ea5c8',
    colorAccentBlue:   '#1a72b0',
    colorAccentRed:    '#c0283a',
    colorText:         '#a8c8e0',
    colorTextDim:      '#4870a0',
    colorTextBright:   '#deeeff',
    fontDisplay:       "'Orbitron', monospace",
    fontBody:          "'Share Tech Mono', monospace",
    fontSizeBase:      '16px',
    fontSizeSm:        '14px',
    fontSizeLg:        '19px',
    fontSizeXl:        '22px',
  },

  // ─── Random Events ───────────────────────────────────────────────────────
  /** Chance (0–1) per tick a random event triggers */
  RANDOM_EVENT_CHANCE_PER_TICK: 0.05,

  // ─── Dev Mode ────────────────────────────────────────────────────────────
  DEV_MODE_DEFAULT: false,

});
