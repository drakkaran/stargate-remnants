/**
 * STARGATE: REMNANTS — Names
 * Procedural name generation with Stargate-thematic flavour.
 *
 * The SGC draws personnel from across Earth, so names span many cultures.
 * Military ranks, call-signs, and designations are layered on top.
 * Three generation modes: full name, call-sign, and designation.
 */

const Names = (() => {

  // ── Name pools ───────────────────────────────────────────────────────────
  // Multi-cultural, military-adjacent, vaguely Stargate-flavoured.

  const FIRST = Object.freeze({
    // Western
    en: [
      'Jack','Daniel','Samantha','Cameron','Vala','Janet','Walter','Siler',
      'Dixon','Reynolds','Pierce','Harris','Quinn','Blake','Ford','Grant',
      'Lorne','Reed','Shaw','Stone','Wade','Holt','Cross','Marsh','Drake',
      'Brynn','Skye','Regan','Quinn','Sloane','Avery','Caden','Rylan',
    ],
    // Eastern European / Russian-adjacent
    eu: [
      'Nikolai','Alexei','Sasha','Tomas','Marek','Pavel','Dmitri','Irina',
      'Nadia','Mila','Zara','Petra','Renata','Boris','Viktor','Katya',
    ],
    // Middle Eastern / South Asian
    sa: [
      'Tariq','Farid','Reza','Darius','Cyrus','Layla','Nour','Shirin',
      'Parisa','Priya','Arjun','Rohan','Kavya','Nirav','Ananya','Devika',
    ],
    // East Asian
    ea: [
      'Chen','Wei','Liang','Jin','Mei','Yuki','Kenji','Hana','Sora',
      'Miko','Ren','Akira','Taro','Nao','Yuna','Joon','Seo','Hyun',
    ],
    // African / Sub-Saharan
    af: [
      'Kofi','Kwame','Amara','Zola','Nia','Seun','Temi','Yemi','Ade',
      'Chidi','Emeka','Ngozi','Kemi','Bayo','Femi','Tobi','Sade','Dayo',
    ],
    // Latin American
    la: [
      'Marco','Diego','Lucia','Elena','Rafael','Catalina','Javier','Valentina',
      'Miguel','Isabela','Carlos','Adriana','Andres','Sofia','Luis','Camila',
    ],
  });

  const LAST = Object.freeze([
    // Military-feeling surnames from many origins
    'Harrow','Vasquez','Osei','Tran','Mercer','Kovacs','Ndulu','Payne',
    'Reyes','Sung','Farida','Okoro','Bashir','Delacroix','Nakamura','Petrov',
    'Thornton','Salazar','Nkosi','Kurosawa','Brennan','Adeyemi','Volkov','Ferreira',
    'Castellano','Mbeki','Lindqvist','Rajput','Holbrook','Zafar','Marchetti','Oduya',
    'Calloway','Szymanski','Guerrero','Tanaka','Whitfield','Asante','Sorensen','Iqbal',
    'Lassiter','Yamamoto','Devereux','Okonkwo','Greyson','Solano','Eriksson','Chaudhry',
    'Montoya','Iweala','Blackwood','Nair','Stafford','Barrientos','Lindberg','Mensah',
  ]);

  // ── Call-sign pool ───────────────────────────────────────────────────────
  // SGC teams use NATO phonetics, animals, terrain, celestial objects.
  const CALLSIGNS = Object.freeze([
    'Viper','Hawk','Ghost','Nomad','Razor','Torch','Phantom','Titan',
    'Rook','Bishop','Kestrel','Oracle','Dagger','Cipher','Onyx','Wraith',
    'Sable','Corsair','Lynx','Spectre','Comet','Flint','Cobalt','Echo',
    'Talon','Hydra','Zenith','Rift','Warden','Sage','Ember','Frost',
    'Archon','Brace','Crucible','Dirge','Envoy','Forge','Gauntlet','Herald',
  ]);

  // ── Rank pool ────────────────────────────────────────────────────────────
  const RANKS = Object.freeze({
    combat:    ['Lt.','Cpt.','Maj.','Sgt.','Cpl.'],
    science:   ['Dr.','','','',''],          // scientists are often civilians
    diplomacy: ['Cmdr.','Lt.','','',''],
    survival:  ['Sgt.','Cpl.','','',''],
    balanced:  ['Maj.','Lt.','Cpt.','',''],
  });

  // ── Internal helpers ─────────────────────────────────────────────────────

  function _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function _pickFirst() {
    // Weight toward en/sa/ea/af for SGC diversity feel
    const pools = Object.values(FIRST);
    const pool  = _pick(pools);
    return _pick(pool);
  }

  function _pickLast() {
    return _pick(LAST);
  }

  // ── Base name pools ──────────────────────────────────────────────────────

  const BASE_PREFIX = Object.freeze([
    'Station','Outpost','Site','Base','Enclave','Beacon','Relay',
  ]);

  // Sci-fi world names: astronomical, ancient, Stargate-ish, alien-sounding
  const BASE_SUFFIX = Object.freeze([
    // Astronomical
    'Proxima','Arcturus','Kepler','Vega','Sirius','Helios','Solaris',
    'Deneb','Rigel','Altair','Capella','Procyon','Antares','Fomalhaut',
    'Pollux','Spica','Betelgeuse','Acrux','Mimosa','Hadar',
    // Ancient / mythological
    'Elysium','Erebus','Hyperion','Prometheus','Kronos','Tartarus',
    'Typhon','Aether','Selene','Phoebe','Tethys','Rhea','Nemesis',
    // Stargate-ish alien worlds
    'Dakara','Athos','Langara','Orilla','Hanka','Kelowna',
    'Tollana','Tagrea','Pangar','Madronas','Talthus','Verus',
    'Kheb','Edora','Edoris','Netu','Simarka','Madrona',
    // Sci-fi / evocative
    'Nexus','Threshold','Meridian','Cipher','Vortex','Nova',
    'Astral','Zenith','Apex','Quantum','Corona','Aegis',
  ]);

  // ── Public API ───────────────────────────────────────────────────────────

  return {

    /**
     * Generate a full name for a personnel archetype.
     * @param {'combat'|'science'|'diplomacy'|'survival'|'balanced'} archetype
     * @returns {string} "Rank FirstName LastName" or "FirstName LastName"
     */
    generate(archetype = 'balanced') {
      const first = _pickFirst();
      const last  = _pickLast();
      const rankPool = RANKS[archetype] ?? RANKS.balanced;
      const rank  = _pick(rankPool);
      return rank ? `${rank} ${first} ${last}` : `${first} ${last}`;
    },

    /**
     * Generate just a first + last name (no rank prefix).
     * @returns {string}
     */
    generatePlain() {
      return `${_pickFirst()} ${_pickLast()}`;
    },

    /**
     * Generate a random call-sign.
     * @returns {string}
     */
    callsign() {
      return _pick(CALLSIGNS);
    },

    /**
     * Generate a random base/outpost name, e.g. "Outpost Valhalla".
     * @returns {string}
     */
    generateBaseName() {
      return `${_pick(BASE_PREFIX)} ${_pick(BASE_SUFFIX)}`;
    },

    /**
     * Generate a gate-team designation string, e.g. "SG-7".
     * @param {number} num
     * @returns {string}
     */
    teamDesignation(num) {
      return `SG-${num}`;
    },

    /**
     * Pick a unique name not already used in the current game state.
     * Falls back to plain generation if all names were somehow used.
     * @param {GameState} s
     * @param {string} archetype
     * @returns {string}
     */
    generateUnique(s, archetype = 'balanced') {
      const existing = new Set(s.personnel.map(p => p.name));
      let attempts = 0;
      let name;
      do {
        name = this.generate(archetype);
        attempts++;
      } while (existing.has(name) && attempts < 40);
      return name;
    },

  };

})();
