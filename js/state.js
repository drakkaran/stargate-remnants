/**
 * STARGATE: REMNANTS — State
 * Central game state. All fields stubbed; engine populates on new game / load.
 */

const State = (() => {
  /** @type {GameState} */
  let _state = null;

  /**
   * Build a fresh game state for a new game.
   * @param {string} difficulty - 'easy' | 'normal' | 'hard'
   * @returns {GameState}
   */
  function createNew(difficulty = 'normal') {
    return {
      // ── Meta ────────────────────────────────────────────────────────────
      version:     CONFIG.VERSION,
      difficulty,
      baseName:    'Outpost Remnant',
      playTime:    0,           // total real-world seconds played
      createdAt:   Date.now(),
      savedAt:     null,

      // ── Time ────────────────────────────────────────────────────────────
      tick:        0,           // absolute tick count since game start
      hour:        6,           // current in-game hour (0–23)
      day:         1,           // current in-game day
      paused:      false,

      // ── Resources ───────────────────────────────────────────────────────
      resources:   { ...CONFIG.STARTING_RESOURCES },
      resourceCap: CONFIG.DEFAULT_RESOURCE_LIMIT,   // base cap; Storage room multiplies

      // ── Personnel ───────────────────────────────────────────────────────
      /**
       * @type {Personnel[]}
       * Each: { id, name, health, maxHealth, stats:{combat,diplomacy,science,survival},
       *         training:{stat, hoursRemaining} | null, item: itemId | null, alive: bool }
       */
      personnel: [],

      // ── Base / Rooms ─────────────────────────────────────────────────────
      /**
       * @type {Room[]}
       * Each: { id, type, level, constructing: bool, hoursRemaining: number }
       * Installed by default: 'gate_room', 'control_room'
       */
      rooms: [
        { id: 'gate_room',    type: 'gate_room',    level: 1, constructing: false, hoursRemaining: 0 },
        { id: 'control_room', type: 'control_room', level: 1, constructing: false, hoursRemaining: 0 },
      ],

      // ── Research ─────────────────────────────────────────────────────────
      /**
       * @type {{ researched: string[], inProgress: {id:string, hoursRemaining:number} | null }}
       */
      research: {
        researched:  [],
        inProgress:  null,
      },

      // ── Items ────────────────────────────────────────────────────────────
      /**
       * @type {Item[]}
       * Each: { id, type, assignedTo: personnelId | null }
       */
      items: [],

      // ── Crafting ─────────────────────────────────────────────────────────
      crafting: {
        inProgress: null,   // { type, hoursRemaining }
      },

      // ── Gate / Worlds ─────────────────────────────────────────────────────
      /**
       * @type {World[]}
       * Each: { id, name, address: symbol[], decoded: bool, visited: bool, biome, description }
       */
      worlds: [],
      /** Currently dialed address symbols (partial / complete) */
      dialedAddress:   [],
      /** Saved addresses: { name, address: symbol[] }[] */
      savedAddresses:  [],
      /** Decoding hints available (legacy) */
      decodingHints:   0,

      // ── Address Decoding ──────────────────────────────────────────────────
      /**
       * Per-world decoding progress. Populated by Decoding.ensureState(s).
       * Each entry keyed by worldId: {
       *   state:          'unknown'|'rumoured'|'hinted'|'fragment'|'decoded'
       *   knownSymbols:   string[]   — confirmed symbol names
       *   puzzlesDone:    string[]   — riddle_<sym> / elim IDs completed
       *   hintLog:        { day, source, symbols[] }[]
       *   dbSearched:     string[]   — DB keyword entries already used
       *   elimEliminated: string[]   — symbols ruled out by elimination
       * }
       */
      decoding: {},

      // ── Off-world ─────────────────────────────────────────────────────────
      /**
       * @type {{ worldId: string, team: string[], missions: MissionResult[] } | null}
       * Populated when the player is off-world.
       */
      offWorld: null,

      // ── Events & Log ─────────────────────────────────────────────────────
      /**
       * @type {LogEntry[]}
       * Each: { tick, day, hour, type, message }
       */
      log: [],
      /**
       * @type {ActiveEvent | null}
       * Inbound gate event awaiting player response.
       */
      activeEvent: null,

      // ── Events tracking ────────────────────────────────────────────────
      events: {
        firedOneShot: [],   // ids of one-shot events already triggered
        gateTrips:    0,    // total completed off-world trips (scales inbound gate chance)
      },

      // ── Flags / Progress ─────────────────────────────────────────────────
      flags: {
        introSeen:               false,
        tutorialSeen:            false,
        earthAttempted:          false,
        earthContactAttempted:   false,   // Phase 7: one-shot Earth signal response
        replicatorsKnown:        false,
        replicatorImmunity:      false,   // set by replicator_countermeasures research
        alphaFound:              false,
        alphaSiteVisited:        false,
        pegasusAddressKnown:     false,
        pegasusAddressAnnounced: false,   // Phase 7: scripted beat tracker
        zpmInterfaceResearched:  false,
        zpmInterfaceAnnounced:   false,   // Phase 7: scripted beat tracker
        zpmInstalled:            false,
        gameWon:                 false,
        gameLost:                false,
      },

      // ── UI ───────────────────────────────────────────────────────────────
      ui: {
        currentScene:  'home',   // 'home' | 'personnel' | 'gate' | 'offworld' | 'research' | 'crafting'
        menuOpen:      false,
        devMode:       CONFIG.DEV_MODE_DEFAULT,
        soundEnabled:  false,
      },
    };
  }

  return {
    /** Initialise with a fresh game state */
    init(difficulty) {
      _state = createNew(difficulty);
      return _state;
    },

    /** Replace state entirely (used by load) */
    load(savedState) {
      _state = savedState;
    },

    /** Get a reference to the current state */
    get() {
      return _state;
    },

    /** Convenience: get a nested value by dot-path (read-only helper) */
    read(path) {
      return path.split('.').reduce((o, k) => (o ?? {})[k], _state);
    },

    /** Convenience: set a nested value by dot-path */
    write(path, value) {
      const keys = path.split('.');
      const last = keys.pop();
      const target = keys.reduce((o, k) => o[k], _state);
      target[last] = value;
    },

    /** Check if state is initialised */
    isReady() {
      return _state !== null;
    },
  };
})();
