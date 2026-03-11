/**
 * STARGATE: REMNANTS — Decoding System (Phase 5)
 *
 * Turns raw intel into dialable gate addresses through four interlocking mechanics:
 *
 *   1. RIDDLE PUZZLES        — metaphorical clue → identify one symbol (early game)
 *   2. ELIMINATION PUZZLES   — logic grid: rule out wrong symbols (mid-game)
 *   3. HINT PIPELINE         — artifacts, data scans, travellers, missions (passive)
 *   4. ANCIENT DB SEARCH     — keyword lookup (requires 'ancient_db_search' research)
 *
 * ADDRESS STATES  (s.decoding[worldId].state):
 *   'unknown'   — world exists in DB, player has zero knowledge
 *   'rumoured'  — name/biome known but no symbols
 *   'hinted'    — 1–3 symbols confirmed
 *   'fragment'  — 4–5 symbols confirmed
 *   'decoded'   — all 6 confirmed → added to Gate speed-dial
 *
 * Each world's decoding record lives at s.decoding[worldId]:
 *   { state, knownSymbols[], puzzlesDone[], hintLog[], dbSearched[], elimEliminated[] }
 */

const Decoding = (() => {

  // ─── Address state constants ───────────────────────────────────────────────

  const ADDR = Object.freeze({
    UNKNOWN:  'unknown',
    RUMOURED: 'rumoured',
    HINTED:   'hinted',
    FRAGMENT: 'fragment',
    DECODED:  'decoded',
  });

  // ─── Per-symbol riddle catalogue ───────────────────────────────────────────
  // Covers every symbol that appears in an address in PLANET_DB.
  // Each entry:  answer (symbol name), text (the riddle), source (flavour),
  //              decoys (2 wrong choices presented alongside the answer)

  const RIDDLE_BOOK = Object.freeze({

    // ── address symbols actually used across the 7 locked worlds ─────────────
    // p4c_227  : mountain comet crown serpent anchor star
    // p5s_117  : tree moon scarab flame hand eclipse
    // p2r_890  : desert sun skull naquadah spiral tower
    // p7x_044  : house heart water star bridge moon
    // p9v_312  : flame storm mountain naquadah quantum ascension
    // p1a_ancient: ascension zpm quantum infinity star gate
    // p6m_ghost: wolf nebula skull eclipse hourglass key

    mountain: {
      text:   'I am the spine of every world worth visiting. The Ancients measured altitude in my name. Worlds that carry my symbol have terrain that reaches for the sky — immovable, ancient, enduring.',
      source: 'Ancient geological survey catalogue fragment — terrain classification tier 4.',
      decoys: ['tower', 'anchor'],
    },
    comet: {
      text:   'I cross the dark between stars and leave a glowing trail behind me. Every civilisation that has ever lifted its eyes calls me an omen. I am change made visible in the night sky.',
      source: 'Goa\'uld astronomical log, recovered from derelict Ha\'tak. Era: early conquest.',
      decoys: ['star', 'flame'],
    },
    crown: {
      text:   'I am what rulers wear when they want the ruled to feel small. I am authority pressed into a circle. The Goa\'uld System Lords adored this symbol — it marks their administrative capitals.',
      source: 'Goa\'uld imperial heraldry register. Classification: throne-world.',
      decoys: ['eye', 'scales'],
    },
    serpent: {
      text:   'I am the coil that eats its own tail. Eternal dominion is what I represent. The Goa\'uld chose me as their highest symbol — I appear in addresses for their most prized possessions.',
      source: 'Goa\'uld ceremonial text, Apophis dynasty. Inscription: "He who is without end."',
      decoys: ['spiral', 'infinity'],
    },
    anchor: {
      text:   'When everything else is swept away by current and tide, I remain fixed. I am the grounding point. The Ancients used me to mark permanent installations — bases meant never to move.',
      source: 'Ancient base installation designation registry. Category: fixed-site.',
      decoys: ['bridge', 'key'],
    },
    star: {
      text:   'I am not the sun of any world — I am the distant fixed point that navigators trust above all others. When you need to know where you are, you find me. I am the address-maker\'s constant.',
      source: 'Ancient navigation handbook, stellar reference section.',
      decoys: ['sun', 'nebula'],
    },
    tree: {
      text:   'I am root below and branch above — two worlds at once. The Ancients used me to mark worlds where the carbon cycle has run for hundreds of millions of years. Life always begins here.',
      source: 'Tok\'ra biosphere survey, inhabited-world classification.',
      decoys: ['water', 'spiral'],
    },
    moon: {
      text:   'I am not the source of the light, but its mirror. I govern tides, cycles, the dreams of night-watchers. My symbol marks worlds tidally influenced — or worlds that themselves orbit something larger.',
      source: 'Ancient orbital mechanics notation document.',
      decoys: ['sun', 'eclipse'],
    },
    scarab: {
      text:   'I begin in decay and end in flight. Transformation is my essence — not the change of seasons, but the radical reinvention of form itself. The Ra cult worshipped me as the soul of renewal.',
      source: 'Ra-era ceremonial text, cult of transformation. Translated from Middle Goa\'uld.',
      decoys: ['skull', 'serpent'],
    },
    flame: {
      text:   'I am what you see when matter surrenders to energy. I purify and I destroy — the Ancients used me to mark worlds of volcanic or extreme thermal activity. I am dangerous and honest.',
      source: 'Ancient geological hazard classification. Category: thermal-extreme world.',
      decoys: ['storm', 'desert'],
    },
    hand: {
      text:   'I reach, I build, I destroy, I write. I am the physical expression of will — the five-fingered bridge between thought and consequence. Ancient construction sites bear my mark.',
      source: 'Ancient construction survey marker, found embedded in an outpost wall.',
      decoys: ['bridge', 'key'],
    },
    eclipse: {
      text:   'I happen once in a lifetime. Two bodies — the lesser perfectly occults the greater — for a few still minutes the sky goes dark at noon. I mark worlds where perfect celestial alignment is frequent.',
      source: 'Tok\'ra astronomical observation log. Note: uncommon symbol — used for precise coordinate fixing.',
      decoys: ['moon', 'sun'],
    },
    desert: {
      text:   'I am patience in stone form. A billion years of wind have made me. Worlds bearing my symbol have almost no standing water — vast and barren above ground, but often rich beneath.',
      source: 'Goa\'uld mining administration archive. Category: arid extraction world.',
      decoys: ['mountain', 'flame'],
    },
    sun: {
      text:   'I am the warmth that made life possible. The Ancients placed me first in their catalogues. Any address crossing a world that orbits within a habitable zone carries my witness.',
      source: 'Inscribed on a DHD access panel. Category: stellar presence marker.',
      decoys: ['star', 'eclipse'],
    },
    skull: {
      text:   'I am what remains when everything else is gone. I am not death — I am its evidence. Worlds carrying my symbol have histories of mass mortality: plague, purge, or war without mercy.',
      source: 'Goa\'uld medical quarantine log. Category: historical mortality event.',
      decoys: ['tomb', 'hourglass'],
    },
    naquadah: {
      text:   'I am the element the gate is made of. Dense, energetic, near-miraculous. The Goa\'uld built their entire empire around my veins. My symbol marks worlds rich in the ore that powers everything.',
      source: 'Goa\'uld mining survey. Resource classification: primary extraction world.',
      decoys: ['flame', 'quantum'],
    },
    spiral: {
      text:   'I am the shape of galaxies, shells, and storms. I am growth that always turns. The Ancients associated me with spacetime topology — worlds of theoretical significance carry my mark.',
      source: 'Ancient cosmological notation. Theoretical physics — topology classification.',
      decoys: ['infinity', 'nebula'],
    },
    tower: {
      text:   'I reach upward alone. I am ambition made architecture. The Ancients built me over gate sites to watch local space. Worlds bearing my symbol have — or had — elevated observation structures.',
      source: 'Ancient space-monitoring facility catalogue.',
      decoys: ['mountain', 'gate'],
    },
    house: {
      text:   'I am four walls and a roof. I am shelter from everything outside. In the gate network I mark inhabited worlds — places where humans have built communities and consider themselves home.',
      source: 'Tok\'ra settlement survey. Category: human-inhabited world.',
      decoys: ['bridge', 'tomb'],
    },
    heart: {
      text:   'I am not merely the physical organ — I am what a people cares about most. The Ancients used me when they meant the essential nature of a world: what it is at its core, what it protects.',
      source: 'Ancient philosophical text fragment. Category: moral-essence notation.',
      decoys: ['scales', 'hand'],
    },
    water: {
      text:   'Every world the Ancients considered habitable has me. I wear away stone over millennia. I carry life in my currents. The gate address for any world with a living ocean almost always holds my symbol.',
      source: 'Carved on the base of a water-side DHD. Category: elemental navigational marker.',
      decoys: ['tree', 'bridge'],
    },
    bridge: {
      text:   'I span what cannot otherwise be crossed. I am neither origin nor destination but the means of transit. The Ancients used me for worlds that served as relay points between distant gate clusters.',
      source: 'Ancient gate network routing schematic. Category: relay-node world.',
      decoys: ['gate', 'anchor'],
    },
    storm: {
      text:   'I discharge the sky\'s accumulated tension in a single moment. I am electricity born of friction. Worlds carrying my mark have powerful magnetic fields and cycles of violent atmospheric discharge.',
      source: 'Meteorological survey note, Ancient probe drifting in the outer system.',
      decoys: ['flame', 'comet'],
    },
    quantum: {
      text:   'I am below the threshold of the visible. I am the rule beneath the rules. The Ancients used me to mark worlds where their deepest research took place — experiments at the edge of reality itself.',
      source: 'Ancient subatomic research classification. Category: deep-physics installation.',
      decoys: ['infinity', 'ascension'],
    },
    ascension: {
      text:   'I am what the Ancients became when they surrendered their physical forms. I am transcendence — the last step of a long journey. Worlds bearing my symbol were sacred: places of final meditation.',
      source: 'Ancient philosophical-religious text. Category: transcendence site.',
      decoys: ['infinity', 'zpm'],
    },
    zpm: {
      text:   'I am a container for the energy of a universe. The most powerful object the Ancients ever built. My symbol marks only the most critical addresses — where zero-point modules were stored or made.',
      source: 'Ancient power engineering specification. Classification: ZPM-critical site.',
      decoys: ['naquadah', 'key'],
    },
    infinity: {
      text:   'I have no beginning and no end. I am the shape of a universe that curves back on itself. The Ancients used me as a mathematical marker for installations dedicated to knowledge without limit.',
      source: 'Ancient theoretical mathematics document. Category: conceptual-limit marker.',
      decoys: ['spiral', 'scales'],
    },
    gate: {
      text:   'I am the threshold — passage itself. My presence in an address is philosophically recursive. The Ancients placed me to mark worlds that are themselves nexus points of the greater network.',
      source: 'Ancient network topology document. Category: nexus-world.',
      decoys: ['bridge', 'tower'],
    },
    wolf: {
      text:   'I run with others. I am dangerous not alone but in numbers — coordinated, patient, strategic. The Jaffa elite scouting corps adopted me as their insignia. I mark worlds where hunters once lived.',
      source: 'Jaffa military insignia registry, First Prime archive.',
      decoys: ['lion', 'serpent'],
    },
    nebula: {
      text:   'I am vast and diffuse — the womb of stars, not yet a star myself. The Ancients used me as a deep-space navigational marker, visible from great distances, useful for fixing coordinates in the outer rim.',
      source: 'Ancient long-range sensor buoy data. Class: stellar nursery marker.',
      decoys: ['star', 'spiral'],
    },
    hourglass: {
      text:   'Sand falls. I measure what cannot be stopped. The Ancients placed me on worlds at a critical juncture — places that were failing, or changing, or important to visit before it was too late.',
      source: 'Ancient world-assessment log. Category: world requiring urgent attention.',
      decoys: ['skull', 'scales'],
    },
    key: {
      text:   'I do not open every door — only the one I was made for. I am the specific answer to a specific question. The Ancients used me to mark worlds where access requires prior knowledge to proceed.',
      source: 'Ancient access-classification system. Category: gated-knowledge site.',
      decoys: ['gate', 'tomb'],
    },
  });

  // ─── Per-world riddle sequence definitions ─────────────────────────────────
  // Maps worldId → ordered list of riddle steps.
  // Each step reveals one symbol when solved. The player works through them sequentially.
  // Three riddles cover half the address; the rest come from elimination or hints.

  const WORLD_RIDDLE_SEQUENCES = Object.freeze({
    p4c_227:   ['mountain', 'star', 'anchor'],        // ice world
    p5s_117:   ['tree', 'scarab', 'eclipse'],         // jungle
    p2r_890:   ['desert', 'naquadah', 'tower'],       // desert
    p7x_044:   ['house', 'heart', 'bridge'],          // inhabited
    p9v_312:   ['flame', 'storm', 'ascension'],       // volcanic
    p1a_ancient: ['ascension', 'zpm', 'gate'],        // ancient outpost
    p6m_ghost: ['wolf', 'hourglass', 'key'],          // ghost moon
  });

  // ─── Elimination puzzle definitions ───────────────────────────────────────
  // Used when knownSymbols.length >= 3 and unknownCount <= 3.
  // Each template specifies:
  //   pool     — all symbols the player must choose from (correct + wrong)
  //   clue     — logic hint (does NOT name the answer directly)
  //   worldId  — which world this applies to
  //   reveals  — the correct symbol names to select

  const ELIM_PUZZLES = Object.freeze([
    // ── p4c_227 (ice) needs: comet, crown, serpent ─────────────────────────
    {
      id:      'elim_ice_comet',
      worldId: 'p4c_227',
      reveals: ['comet'],
      pool:    ['comet', 'star', 'nebula', 'eclipse'],
      clue:    'The remaining celestial symbol in this address is not fixed in the sky — it moves. It crosses the void between stars leaving a trail behind it. Ancient navigators treated it as an omen of change, not a reference point.',
    },
    {
      id:      'elim_ice_crown_serpent',
      worldId: 'p4c_227',
      reveals: ['crown', 'serpent'],
      pool:    ['crown', 'serpent', 'skull', 'eye', 'wolf', 'lion'],
      clue:    'The Goa\'uld classified this world as a controlled site. Two symbols from the Goa\'uld authority-and-dominion set appear in this address. The first marks rulership. The second marks eternal dominion without end.',
    },
    // ── p5s_117 (jungle) needs: moon, flame, hand ─────────────────────────
    {
      id:      'elim_jungle_moon',
      worldId: 'p5s_117',
      reveals: ['moon'],
      pool:    ['moon', 'sun', 'star', 'eclipse'],
      clue:    'The celestial symbol in the remaining positions is not a source of light — it is a reflector. It also marks worlds with strong tidal forces, or worlds that orbit a larger body.',
    },
    {
      id:      'elim_jungle_flame_hand',
      worldId: 'p5s_117',
      reveals: ['flame', 'hand'],
      pool:    ['flame', 'hand', 'storm', 'desert', 'eye', 'bridge'],
      clue:    'Two symbols remain. One is a nature symbol marking extreme thermal processes — not electrical, but combustive. The other is a human symbol: not the organ of sight, but the organ of action and construction.',
    },
    // ── p2r_890 (desert) needs: sun, skull, spiral ────────────────────────
    {
      id:      'elim_desert_sun',
      worldId: 'p2r_890',
      reveals: ['sun'],
      pool:    ['sun', 'star', 'comet', 'eclipse'],
      clue:    'The celestial symbol here is the most fundamental of all — not a distant waypoint or a moving omen, but the star that the world orbits directly. Life is possible because of it, even if this world has none.',
    },
    {
      id:      'elim_desert_skull_spiral',
      worldId: 'p2r_890',
      reveals: ['skull', 'spiral'],
      pool:    ['skull', 'spiral', 'hourglass', 'infinity', 'tomb', 'heart'],
      clue:    'Two symbols from very different categories complete this address. The first records a history of mass death on this world — the Goa\'uld were thorough here. The second is cosmological: the shape of galaxies, the topology of space itself.',
    },
    // ── p7x_044 (inhabited) needs: water, star, moon ──────────────────────
    {
      id:      'elim_inhabited_water',
      worldId: 'p7x_044',
      reveals: ['water'],
      pool:    ['water', 'tree', 'storm', 'mountain'],
      clue:    'This nature symbol marks the element that makes this world so remarkably hospitable. Not the life that grows from it — the substance itself. The Ancients used it to mark worlds with abundant liquid water on the surface.',
    },
    {
      id:      'elim_inhabited_star_moon',
      worldId: 'p7x_044',
      reveals: ['star', 'moon'],
      pool:    ['star', 'moon', 'sun', 'comet', 'nebula', 'eclipse'],
      clue:    'Two celestial symbols complete this inhabited world\'s address. One is a fixed navigation reference — the distant waypoint navigators trust. The other marks the world\'s tidal companion — the body that keeps their seas in rhythm.',
    },
    // ── p9v_312 (volcanic) needs: mountain, naquadah, quantum ─────────────
    {
      id:      'elim_volcanic_mountain',
      worldId: 'p9v_312',
      reveals: ['mountain'],
      pool:    ['mountain', 'tower', 'anchor', 'bridge'],
      clue:    'Of the structural and terrain symbols, the remaining one in this address describes something natural — not built, but formed. It rises from the ground and marks a world of extreme terrain. The volcanic activity here has created features that reach for the sky.',
    },
    {
      id:      'elim_volcanic_naquadah_quantum',
      worldId: 'p9v_312',
      reveals: ['naquadah', 'quantum'],
      pool:    ['naquadah', 'quantum', 'ascension', 'zpm', 'crystals', 'flame'],
      clue:    'Two Ancient-category symbols remain. The first is the element — the ore that powers the gate network, present here in extraordinary concentration. The second marks deepest scientific investigation: not transcendence, not energy storage, but the subatomic truth beneath matter itself.',
    },
    // ── p1a_ancient (ancient outpost) needs: zpm, quantum, infinity, star ──
    {
      id:      'elim_ancient_infinity_star',
      worldId: 'p1a_ancient',
      reveals: ['infinity', 'star'],
      pool:    ['infinity', 'star', 'spiral', 'nebula', 'scales', 'anchor'],
      clue:    'Two symbols in this address come from different categories. One is a conceptual symbol from the Ancients\' philosophical notation — the shape of knowledge without limit, the loop that has no end. The other is celestial — not the local star, but the fixed distant reference point the Ancients used for deep-space triangulation.',
    },
    {
      id:      'elim_ancient_quantum',
      worldId: 'p1a_ancient',
      reveals: ['quantum'],
      pool:    ['quantum', 'ascension', 'zpm', 'naquadah'],
      clue:    'One Ancient symbol remains unconfirmed in this address. This outpost contained research that went deeper than energy or transcendence — it probed the subatomic foundations of matter and reality. The Ancients kept records of experiments conducted at the boundary of what is knowable.',
    },
    // ── p6m_ghost (moon) needs: nebula, skull, eclipse ────────────────────
    {
      id:      'elim_ghost_nebula_eclipse',
      worldId: 'p6m_ghost',
      reveals: ['nebula', 'eclipse'],
      pool:    ['nebula', 'eclipse', 'star', 'comet', 'moon', 'sun'],
      clue:    'Two celestial symbols complete this moon world\'s address. One is the vast diffuse cloud visible from the surface — a deep-sky navigational marker, the birthplace of stars. The other marks the frequent eclipses caused by the moon\'s orbital geometry around its gas giant host.',
    },
    {
      id:      'elim_ghost_skull',
      worldId: 'p6m_ghost',
      reveals: ['skull'],
      pool:    ['skull', 'hourglass', 'tomb', 'heart'],
      clue:    'One final human-category symbol completes this address. The fortress here saw terrible things. The Goa\'uld\'s own records mark this world with the symbol for historical mass death. It is not a measure of time, not a sealed chamber — it is the residue of violence on a grand scale.',
    },
  ]);

  // ─── Ancient Database keyword entries ─────────────────────────────────────
  // Unlocked by 'ancient_db_search' research. Each search costs 1 ancientTech.
  // Each keyword uniquely maps to one world and reveals specific symbols.

  const DB_ENTRIES = Object.freeze([
    // p4c_227 — ice
    { keywords: ['glacial', 'ice', 'frozen', 'glacier', 'crystal'],
      worldId: 'p4c_227',
      reveals: ['mountain', 'anchor'],
      excerpt: 'SURVEY LOG P4C. Terrain class: glacial. Continental ice sheet over ancient bedrock. Permanent installation designated anchor-class (never to be abandoned). Terrain elevation: mountain-class. Crystallographic research station, level 3. Operational status: preserved.',
    },
    { keywords: ['comet', 'serpent', 'crown', 'gould', 'controlled'],
      worldId: 'p4c_227',
      reveals: ['comet', 'crown'],
      excerpt: 'ADMINISTRATIVE RECORD P4C. Goa\'uld control classification: throne-class (crown symbol applied). Stellar reference for address triangulation: cometary-class object used as navigational marker. Note: serpent-dynasty presence confirmed in sub-surface tunnels.',
    },
    // p5s_117 — jungle
    { keywords: ['jungle', 'forest', 'nox', 'canopy', 'plant', 'medicine'],
      worldId: 'p5s_117',
      reveals: ['tree', 'moon'],
      excerpt: 'BIOSPHERE LOG P5S. High-density canopy world. Flora density: tree-class (maximum). Tidal influence detected — moon-class orbital companion confirmed. Biological diversity index: exceptional. Note: possible Nox presence in deep forest. Do not disturb.',
    },
    { keywords: ['scarab', 'eclipse', 'transformation', 'cyclic'],
      worldId: 'p5s_117',
      reveals: ['scarab', 'eclipse'],
      excerpt: 'ECOLOGICAL SURVEY P5S. Transformation-class organisms (scarab-symbol applied per Ra-era notation). Orbital geometry: eclipse-class — frequent total eclipses visible from surface. Atmospheric oxygen: elevated. Personnel note: mild cognitive effects at altitude.',
    },
    // p2r_890 — desert
    { keywords: ['desert', 'mining', 'naquadah', 'gould mine', 'arid'],
      worldId: 'p2r_890',
      reveals: ['desert', 'naquadah'],
      excerpt: 'MINERAL SURVEY P2R. Terrain: desert-class (zero standing water). Naquadah concentration: 340ppm at depth 3km — primary extraction classification. Goa\'uld mining infrastructure installed. Status: inactive. Automated defences: status unknown.',
    },
    { keywords: ['purge', 'skull', 'death', 'spiral', 'apocalypse'],
      worldId: 'p2r_890',
      reveals: ['skull', 'spiral'],
      excerpt: 'CASUALTY SURVEY P2R. Historical mortality event: skull-class classification. Goa\'uld administrative purge recorded — depopulation of servant class. Cosmological note: spiral-galaxy arm reference used for address precision. Tower structure: intact.',
    },
    // p7x_044 — inhabited
    { keywords: ['settlement', 'inhabited', 'human', 'village', 'people', 'freemen'],
      worldId: 'p7x_044',
      reveals: ['house', 'heart'],
      excerpt: 'SETTLEMENT SURVEY P7X. Human population: ~12,000. Settlement type: agrarian-craft. Classification: house-class (permanent habitation). Cultural index: exceptional — heart-class designation (core values of freedom strongly evidenced). Repeated positive contact history.',
    },
    { keywords: ['tides', 'ocean', 'water', 'moon', 'navigation'],
      worldId: 'p7x_044',
      reveals: ['water', 'moon'],
      excerpt: 'HYDROLOGICAL SURVEY P7X. Standing water: abundant (water-class). Tidal patterns: moon-class companion confirmed — regular tidal cycles documented. Agriculture organised around tidal calendar. Star-class object used for night navigation by population.',
    },
    // p9v_312 — volcanic
    { keywords: ['volcanic', 'lava', 'volcano', 'geothermal', 'eruption'],
      worldId: 'p9v_312',
      reveals: ['flame', 'mountain'],
      excerpt: 'GEOLOGICAL SURVEY P9V. Tectonic instability index: maximum. Terrain classification: flame-class thermal hazard. Mountain-class formations generated by ongoing volcanic activity — some peaks exceed 6km. Atmospheric filtration mandatory.',
    },
    { keywords: ['rich', 'naquadah deposit', 'quantum', 'deep', 'ancient research'],
      worldId: 'p9v_312',
      reveals: ['naquadah', 'quantum'],
      excerpt: 'RESOURCE AND RESEARCH SURVEY P9V. Naquadah: 680ppm at depth — exceptional. Ancient research notation: quantum-class subatomic investigation conducted at this site. Note: why would the Ancients investigate quantum physics on a volcanic world? The naquadah deposits here have anomalous quantum properties.',
    },
    // p1a_ancient — ancient outpost
    { keywords: ['ancient', 'outpost', 'lantean', 'ascension', 'transcendence'],
      worldId: 'p1a_ancient',
      reveals: ['ascension', 'gate'],
      excerpt: 'INSTALLATION LOG P1A. Class: outpost, ascension-tier. This installation served as a final reflection site for Lanteans preparing for ascension. Gate-class nexus designation: this DHD contains routing information for multiple galaxy-clusters. Handle with extraordinary care.',
    },
    { keywords: ['zpm', 'zero point', 'pegasus', 'atlantis', 'power'],
      worldId: 'p1a_ancient',
      reveals: ['zpm', 'infinity'],
      excerpt: 'POWER SURVEY P1A. ZPM cradle detected — operational, module absent. ZPM-class site designation applied. Theoretical research log references infinity-class knowledge pursuit — the Ancients here were attempting to understand the limits of the universe itself. Pegasus routing data stored in DHD memory crystal.',
    },
    // p6m_ghost — moon
    { keywords: ['ghost', 'fortress', 'moon', 'missing', 'replicator'],
      worldId: 'p6m_ghost',
      reveals: ['wolf', 'skull'],
      excerpt: 'MILITARY SURVEY P6M. Goa\'uld fortress-class structure confirmed. Historical designation: wolf-class — elite scouting unit stationed here prior to incident. Mortality event: skull-class (entire garrison lost, cause unrecorded). Gate operational. Recommend extreme caution.',
    },
    { keywords: ['eclipse', 'gas giant', 'orbit', 'nebula', 'key'],
      worldId: 'p6m_ghost',
      reveals: ['nebula', 'eclipse'],
      excerpt: 'ORBITAL SURVEY P6M. This moon orbits a gas giant at near-perfect geometry — eclipse-class classification (gas giant regularly eclipses primary star). Nebula formation visible from surface — used as primary navigational reference for address triangulation. Note: key-class site — prior knowledge required for safe approach.',
    },
  ]);

  // ─── Hint source costs ─────────────────────────────────────────────────────

  const HINT_COSTS = Object.freeze({
    artifact:  { artifacts: 2 },         // study artifacts → 1 random symbol
    traveller: { food: 5 },              // feed a traveller → 1–2 symbols
    data_scan: { data: 3 },              // data scan → 2 symbols
    ancient_db:{ ancientTech: 1 },       // DB keyword search → see DB_ENTRIES
    // mission intel: free, granted externally by Missions module
  });

  // ─── State initialisation ──────────────────────────────────────────────────

  /**
   * Ensure s.decoding exists and has a record for every locked PLANET_DB world.
   * Safe to call multiple times (idempotent).
   */
  function ensureState(s) {
    if (!s.decoding) s.decoding = {};
    PLANET_DB.forEach(def => {
      if (def.decoded) return; // starting world — skip
      if (s.decoding[def.id]) return;
      s.decoding[def.id] = {
        state:           ADDR.UNKNOWN,
        knownSymbols:    [],     // confirmed symbols
        puzzlesDone:     [],     // riddle/elim IDs completed
        hintLog:         [],     // { day, source, symbols[] }
        dbSearched:      [],     // keyword strings already used
        elimEliminated:  [],     // symbols ruled out by elimination attempts
      };
    });
  }

  /**
   * Recompute state tier from symbol count. Never downgrades.
   */
  function _recalc(entry) {
    const n = entry.knownSymbols.length;
    if (n >= 6)      entry.state = ADDR.DECODED;
    else if (n >= 4) { if (entry.state !== ADDR.DECODED) entry.state = ADDR.FRAGMENT; }
    else if (n >= 1) { if (entry.state === ADDR.UNKNOWN || entry.state === ADDR.RUMOURED) entry.state = ADDR.HINTED; }
  }

  /**
   * Core symbol-reveal. Adds symbols to knownSymbols if they're actually in the address.
   * Returns { added[], newState }.
   */
  function reveal(s, worldId, symbols, source) {
    ensureState(s);
    const rec = s.decoding[worldId];
    const def = planetById(worldId);
    if (!rec || !def) return { added: [], newState: ADDR.UNKNOWN };

    const added = [];
    symbols.forEach(sym => {
      if (def.address.includes(sym) && !rec.knownSymbols.includes(sym)) {
        rec.knownSymbols.push(sym);
        added.push(sym);
      }
    });

    if (added.length) {
      rec.hintLog.push({ day: s.day, source, symbols: added });
      _recalc(rec);
      if (rec.state === ADDR.DECODED) _unlockForGate(s, def);
    }
    return { added, newState: rec.state };
  }

  /**
   * Promote an unknown world to 'rumoured' (name known, no symbols yet).
   */
  function rumour(s, worldId) {
    ensureState(s);
    const rec = s.decoding[worldId];
    if (rec && rec.state === ADDR.UNKNOWN) {
      rec.state = ADDR.RUMOURED;
      rec.hintLog.push({ day: s.day, source: 'mission_intel', symbols: [] });
    }
  }

  /**
   * Add a decoded world to s.worlds so it appears in Gate speed-dial.
   */
  function _unlockForGate(s, def) {
    if (s.worlds.find(w => w.id === def.id)) {
      s.worlds.find(w => w.id === def.id).decoded = true;
      return;
    }
    s.worlds.push({
      id: def.id, name: def.name, address: def.address,
      decoded: true, visited: false, biome: def.biome, description: def.description,
    });
  }

  // ─── Puzzle helpers ────────────────────────────────────────────────────────

  function _nextRiddleSymbol(worldId, rec) {
    const seq = WORLD_RIDDLE_SEQUENCES[worldId];
    if (!seq) return null;
    return seq.find(sym => !rec.knownSymbols.includes(sym) && !rec.puzzlesDone.includes('riddle_' + sym)) ?? null;
  }

  function _nextElimPuzzle(worldId, rec) {
    return ELIM_PUZZLES.find(p =>
      p.worldId === worldId &&
      !rec.puzzlesDone.includes(p.id) &&
      p.reveals.some(sym => !rec.knownSymbols.includes(sym))
    ) ?? null;
  }

  // ─── Hint grants (called from external modules) ───────────────────────────

  /** Study recovered artifacts to reveal 1 random unknown symbol. */
  function grantArtifactHint(s, worldId, logFn) {
    ensureState(s);
    if (!Resources.canAfford(s, HINT_COSTS.artifact)) {
      logFn('danger', 'Artifact study requires 2 Artifacts.');
      return { ok: false };
    }
    Resources.spend(s, HINT_COSTS.artifact);
    const def = planetById(worldId);
    const rec = s.decoding[worldId];
    if (!def || !rec) return { ok: false };
    const unknown = def.address.filter(sym => !rec.knownSymbols.includes(sym));
    if (!unknown.length) { logFn('info', 'No new symbols to reveal for this world.'); return { ok: false }; }
    const sym = unknown[Math.floor(Math.random() * unknown.length)];
    const r = reveal(s, worldId, [sym], 'artifact_study');
    const g = SYMBOLS.find(x => x.name === sym)?.glyph ?? '';
    logFn('benefit', `Artifact study (${def.name}): symbol identified — ${g} ${sym}. (${rec.knownSymbols.length}/6 known)`);
    return { ok: true, revealed: [sym], newState: r.newState };
  }

  /** Feed a friendly traveller to reveal 1–2 random unknown symbols. */
  function grantTravellerHint(s, worldId, logFn) {
    ensureState(s);
    if (!Resources.canAfford(s, HINT_COSTS.traveller)) {
      logFn('danger', 'Traveller hospitality requires 5 Food.');
      return { ok: false };
    }
    Resources.spend(s, HINT_COSTS.traveller);
    const def = planetById(worldId);
    const rec = s.decoding[worldId];
    if (!def || !rec) return { ok: false };
    const unknown = _shuffle(def.address.filter(sym => !rec.knownSymbols.includes(sym)));
    const pick = unknown.slice(0, Math.min(2, unknown.length));
    if (!pick.length) { logFn('info', 'The traveller has no new information about this world.'); return { ok: false }; }
    const r = reveal(s, worldId, pick, 'friendly_traveller');
    const glyphs = pick.map(n => (SYMBOLS.find(x => x.name === n)?.glyph ?? '') + ' ' + n).join(', ');
    logFn('benefit', `Traveller (${def.name}): ${glyphs} — (${rec.knownSymbols.length}/6 known)`);
    return { ok: true, revealed: pick, newState: r.newState };
  }

  /** Data scan: costs 3 data, reveals 2 symbols. */
  function grantDataScan(s, worldId, logFn) {
    ensureState(s);
    if (!Resources.canAfford(s, HINT_COSTS.data_scan)) {
      logFn('danger', 'Data scan requires 3 Data.');
      return { ok: false };
    }
    Resources.spend(s, HINT_COSTS.data_scan);
    const def = planetById(worldId);
    const rec = s.decoding[worldId];
    if (!def || !rec) return { ok: false };
    const unknown = _shuffle(def.address.filter(sym => !rec.knownSymbols.includes(sym)));
    const pick = unknown.slice(0, Math.min(2, unknown.length));
    if (!pick.length) { logFn('info', 'Data scan found no new symbols for this world.'); return { ok: false }; }
    const r = reveal(s, worldId, pick, 'data_scan');
    const glyphs = pick.map(n => (SYMBOLS.find(x => x.name === n)?.glyph ?? '') + ' ' + n).join(', ');
    logFn('benefit', `Data scan (${def.name}): ${glyphs} — (${rec.knownSymbols.length}/6 known)`);
    return { ok: true, revealed: pick, newState: r.newState };
  }

  /** Mission intel: free. Promotes unknown→rumoured, or reveals 1 symbol. */
  function grantMissionIntel(s, worldId, logFn) {
    ensureState(s);
    const def = planetById(worldId);
    const rec = s.decoding[worldId];
    if (!def || !rec) return { ok: false };
    if (rec.state === ADDR.UNKNOWN) {
      rumour(s, worldId);
      logFn('info', `Mission intel: a world matching "${def.name}" has been mentioned. No address data yet.`);
      return { ok: true, revealed: [], newState: ADDR.RUMOURED };
    }
    const unknown = def.address.filter(sym => !rec.knownSymbols.includes(sym));
    if (!unknown.length) return { ok: false };
    const sym = unknown[Math.floor(Math.random() * unknown.length)];
    const r = reveal(s, worldId, [sym], 'mission_intel');
    logFn('info', `Mission intel (${def.name}): one symbol identified — ${SYMBOLS.find(x => x.name === sym)?.glyph ?? ''} ${sym}.`);
    return { ok: true, revealed: [sym], newState: r.newState };
  }

  // ─── Ancient DB keyword search ────────────────────────────────────────────

  /**
   * Search the Ancient Database by keyword.
   * Requires 'ancient_db_search' in s.research.researched.
   * Costs 1 ancientTech per query.
   * @returns {{ ok, worldId?, planetDef?, reveals[], excerpt?, newState?, error? }}
   */
  function dbSearch(s, keyword) {
    ensureState(s);
    if (!s.research.researched.includes('ancient_db_search')) {
      return { ok: false, error: 'Ancient Database Keyword Search not yet researched.' };
    }
    if (!Resources.canAfford(s, HINT_COSTS.ancient_db)) {
      return { ok: false, error: 'Requires 1 Ancient Tech per search.' };
    }

    const kw = keyword.toLowerCase().trim();
    const entry = DB_ENTRIES.find(e => e.keywords.some(k => k.includes(kw) || kw.includes(k)));

    Resources.spend(s, HINT_COSTS.ancient_db);

    if (!entry) return { ok: false, error: `No records found for "${keyword}". Try a different term.` };

    const rec = s.decoding[entry.worldId];
    if (!rec) return { ok: false, error: 'Internal error: world record missing.' };

    // Check if already searched this exact entry
    const isDuplicate = rec.dbSearched.includes(entry.keywords[0]);
    if (!isDuplicate) rec.dbSearched.push(entry.keywords[0]);

    // Still reveal even on duplicate (but track it)
    if (rec.state === ADDR.UNKNOWN) rumour(s, entry.worldId);

    const r = isDuplicate
      ? { added: [], newState: rec.state }
      : reveal(s, entry.worldId, entry.reveals, 'ancient_db');

    const def = planetById(entry.worldId);
    return {
      ok: true,
      worldId:   entry.worldId,
      planetDef: def,
      reveals:   r.added,
      allReveals: entry.reveals,
      excerpt:   entry.excerpt,
      newState:  rec.state,
      duplicate: isDuplicate,
    };
  }

  // ─── UI State ──────────────────────────────────────────────────────────────

  let _view        = 'index';   // 'index' | 'world' | 'db_search'
  let _worldId     = null;
  let _subView     = 'puzzle';  // 'puzzle' | 'hints'
  let _pendingRiddle    = null; // { sym, def: RiddleBook entry, choices[] }
  let _pendingElim      = null; // EliminationPuzzle object
  let _pendingElimSel   = [];   // currently-selected elim symbols
  let _riddleFeedback   = null; // { correct, chosen, answer } — shown briefly
  let _dbResult         = null; // last DB search result for display

  // ─── Main render entry point ───────────────────────────────────────────────

  function renderScreen(s, container) {
    if (!container) container = document.getElementById('gate-scene') || document.getElementById('decoding-scene');
    if (!container) return;
    ensureState(s);

    if (_view === 'db_search') { _renderDbSearch(s, container); return; }
    if (_view === 'world' && _worldId) { _renderWorldView(s, container); return; }
    // No view open — nothing to render here; caller handles re-render
  }

  // ─── INDEX VIEW ───────────────────────────────────────────────────────────

  function _renderIndex(s, container) {
    const hasDb = s.research.researched.includes('ancient_db_search');
    const locked = PLANET_DB.filter(d => !d.decoded);

    const cards = locked.map(def => {
      const rec = s.decoding[def.id] ?? { state: ADDR.UNKNOWN, knownSymbols: [] };
      const si  = _stateInfo(rec.state);
      const pct = Math.round(rec.knownSymbols.length / 6 * 100);
      const unknown = def.address.length - rec.knownSymbols.length;
      const canPuzzle = rec.state !== ADDR.DECODED;

      return `<div class="dc-card dc-state-${rec.state}" onclick="Decoding.openWorld('${def.id}')">
        <div class="dc-card-icon">${si.glyph}</div>
        <div class="dc-card-body">
          <div class="dc-card-head">
            <span class="dc-card-name">${rec.state === ADDR.UNKNOWN ? '??? — Unknown World' : def.name}</span>
            <span class="dc-badge dc-badge-${rec.state}">${si.label}</span>
          </div>
          <div class="dc-card-sub dim">${rec.state === ADDR.UNKNOWN ? 'No data available' : `${def.biome} · ${def.threat} threat`}</div>
          <div class="dc-sym-row">
            ${def.address.map(sym => {
              const known = rec.knownSymbols.includes(sym);
              const g = SYMBOLS.find(x => x.name === sym)?.glyph ?? '?';
              return `<span class="dc-sym ${known ? 'dc-sym-known' : 'dc-sym-unk'}" title="${known ? sym : '?'}">${known ? g : '░'}</span>`;
            }).join('')}<span class="dc-sym dc-sym-origin" title="origin">⊕</span>
          </div>
          <div class="dc-prog-row">
            <div class="dc-prog-bar"><div class="dc-prog-fill" style="width:${pct}%"></div></div>
            <span class="dim" style="font-size:13px">${rec.knownSymbols.length}/6</span>
          </div>
        </div>
        <div class="dc-card-action">
          ${rec.state === ADDR.DECODED
            ? '<span class="dc-dialable">▶ DIALABLE</span>'
            : canPuzzle
              ? '<span class="dc-hint-action dim">→ Decode</span>'
              : '<span class="dc-hint-action dim">Gather intel first</span>'}
        </div>
      </div>`;
    }).join('');

    container.innerHTML = `
      <div class="dc-layout">
        <div class="dc-header">
          <div>
            <div class="dc-title">Gate Address Intelligence</div>
            <div class="dim" style="font-size:14px">Decode unknown addresses to unlock new worlds for dialing</div>
          </div>
          <div class="dc-header-btns">
            ${hasDb
              ? `<button class="btn btn-amber dc-db-btn" onclick="Decoding.openDbSearch()">⌬ Ancient DB Search<span class="dc-cost-tag">1 Ancient Tech</span></button>`
              : `<span class="dc-locked-tag dim">⌬ Ancient DB Search — research required</span>`}
          </div>
        </div>
        <div class="dc-res-bar">
          <span class="dim" style="font-size:13px;letter-spacing:.06em">HINT RESOURCES:</span>
          ${_resChip('🏺', 'Artifacts', s.resources.artifacts, 2)}
          ${_resChip('📡', 'Data', s.resources.data, 3)}
          ${_resChip('🌿', 'Food', s.resources.food, 5)}
          ${hasDb ? _resChip('⌬', 'Ancient Tech', s.resources.ancientTech, 1) : ''}
        </div>
        <div class="dc-world-list">${cards}</div>
      </div>`;
  }

  // ─── WORLD VIEW ───────────────────────────────────────────────────────────

  function _renderWorldView(s, container) {
    const def = planetById(_worldId);
    const rec = s.decoding[_worldId];
    if (!def || !rec) { _view = 'index'; renderScreen(s); return; }

    const header = _worldHeader(def, rec);
    const tabs = `
      <div class="dc-tabs">
        <button class="dc-tab ${_subView === 'puzzle' ? 'dc-tab-active' : ''}"
                onclick="Decoding.setSubView('puzzle')">Puzzles</button>
        <button class="dc-tab ${_subView === 'hints' ? 'dc-tab-active' : ''}"
                onclick="Decoding.setSubView('hints')">Hints & Sources</button>
      </div>`;

    let body = '';
    if (_subView === 'puzzle') body = _renderPuzzleTab(s, def, rec);
    else body = _renderHintsTab(s, def, rec);

    container.innerHTML = `
      <div class="dc-layout">
        <div class="dc-back-bar">
          <button class="btn btn-ghost" style="font-size:14px" onclick="Gate.closeAddressDecode()">← Back to Gate</button>
        </div>
        ${header}
        ${tabs}
        <div class="dc-tab-body">${body}</div>
      </div>`;
  }

  function _worldHeader(def, rec) {
    const si  = _stateInfo(rec.state);
    const pct = Math.round(rec.knownSymbols.length / 6 * 100);
    return `
      <div class="dc-world-header">
        <div class="dc-wh-left">
          <div class="dc-wh-name">${rec.state === ADDR.UNKNOWN ? 'Unknown World' : def.name}</div>
          <div class="dc-wh-meta dim">${def.biome} · ${def.threat} threat</div>
          <div class="dc-wh-syms">
            ${def.address.map(sym => {
              const known = rec.knownSymbols.includes(sym);
              const g = SYMBOLS.find(x => x.name === sym)?.glyph ?? '?';
              return `<div class="dc-wh-sym ${known ? 'dc-wh-sym-known' : 'dc-wh-sym-unk'}">
                <span class="dc-wh-g">${known ? g : '░'}</span>
                <span class="dc-wh-n">${known ? sym : '?'}</span>
              </div>`;
            }).join('')}
            <div class="dc-wh-sym dc-wh-sym-origin">
              <span class="dc-wh-g">⊕</span><span class="dc-wh-n">origin</span>
            </div>
          </div>
        </div>
        <div class="dc-wh-right">
          <span class="dc-badge dc-badge-${rec.state} dc-badge-lg">${si.glyph} ${si.label}</span>
          <div class="dc-wh-prog">
            <div class="dc-prog-bar dc-prog-bar-wide"><div class="dc-prog-fill" style="width:${pct}%"></div></div>
            <span class="dim" style="font-size:14px">${rec.knownSymbols.length}/6 symbols</span>
          </div>
        </div>
      </div>`;
  }

  // ─── PUZZLE TAB ───────────────────────────────────────────────────────────

  function _renderPuzzleTab(s, def, rec) {
    if (rec.state === ADDR.DECODED) {
      return `<div class="dc-no-puzzle dc-decoded-complete">
        <div class="dc-np-icon">●</div>
        <div class="dc-np-title">Address Fully Decoded</div>
        <p class="dim">${def.name} is available in the Gate speed-dial. All 6 symbols confirmed.</p>
        <div class="dc-decoded-syms">
          ${def.address.map(sym => {
            const g = SYMBOLS.find(x => x.name === sym)?.glyph ?? '?';
            return `<div class="dc-ds"><span>${g}</span><span class="dim">${sym}</span></div>`;
          }).join('')}<div class="dc-ds"><span>⊕</span><span class="dim">origin</span></div>
        </div>
      </div>`;
    }

    // Decide which puzzle to show
    // Priority: riddle (early) → elimination (when ≥3 known)
    const unknown = def.address.filter(sym => !rec.knownSymbols.includes(sym));

    // Try riddle first
    if (!_pendingRiddle && !_pendingElim) {
      const nextSym = _nextRiddleSymbol(def.id, rec);
      if (nextSym) {
        const rd = RIDDLE_BOOK[nextSym];
        if (rd) {
          const choices = _shuffle([nextSym, ...rd.decoys]);
          _pendingRiddle = { sym: nextSym, rd, choices };
        }
      }
      // Try elimination if we have ≥3 known and remaining ≤3
      if (!_pendingRiddle) {
        const ep = _nextElimPuzzle(def.id, rec);
        if (ep) _pendingElim = ep;
      }
    }

    if (_riddleFeedback) return _renderRiddleFeedback();
    if (_pendingRiddle)  return _renderRiddle(def, rec);
    if (_pendingElim)    return _renderElim(def, rec);

    // Nothing available right now
    const needMore = unknown.length > 0;
    return `<div class="dc-no-puzzle">
      <div class="dc-np-icon">◑</div>
      <div class="dc-np-title">${needMore ? 'More Intel Needed' : 'Address Decoded'}</div>
      <p class="dim">${needMore
        ? `${unknown.length} symbol(s) remain. Use hint sources or gather more mission intel to unlock the next puzzle.`
        : 'All puzzles complete.'}</p>
      ${needMore ? `<button class="btn btn-olive" style="margin-top:12px" onclick="Decoding.setSubView('hints')">Hint Sources →</button>` : ''}
    </div>`;
  }

  // ─── RIDDLE ───────────────────────────────────────────────────────────────

  function _renderRiddle(def, rec) {
    const { sym, rd, choices } = _pendingRiddle;
    const unknown = def.address.filter(s => !rec.knownSymbols.includes(s));

    return `<div class="dc-riddle">
      <div class="dc-riddle-tag-row">
        <span class="dc-riddle-tag">SYMBOL RIDDLE</span>
        <span class="dim" style="font-size:14px">${rd.source}</span>
      </div>
      <blockquote class="dc-riddle-text">${rd.text}</blockquote>
      <div class="dc-riddle-prompt dim">Identify the symbol described above:</div>
      <div class="dc-choices">
        ${choices.map(c => {
          const sym = SYMBOLS.find(x => x.name === c);
          return `<button class="dc-choice" onclick="Decoding.submitRiddle('${def.id}', '${c}')">
            <span class="dc-choice-glyph">${sym?.glyph ?? '?'}</span>
            <span class="dc-choice-name">${c}</span>
            <span class="dc-choice-lore dim">${sym?.lore ?? ''}</span>
          </button>`;
        }).join('')}
      </div>
      <button class="btn btn-ghost" style="font-size:14px;margin-top:8px"
              onclick="Decoding.skipPuzzle()">Skip this riddle (no penalty)</button>
    </div>`;
  }

  function _renderRiddleFeedback() {
    const fb = _riddleFeedback;
    const correctSym = SYMBOLS.find(x => x.name === fb.answer);
    return `<div class="dc-riddle-feedback dc-fb-${fb.correct ? 'correct' : 'wrong'}">
      <div class="dc-fb-icon">${fb.correct ? '✓' : '✗'}</div>
      <div class="dc-fb-title">${fb.correct ? 'Correct — symbol identified' : 'Incorrect'}</div>
      <div class="dc-fb-sym">
        <span class="dc-fb-glyph">${correctSym?.glyph ?? '?'}</span>
        <span class="dc-fb-name">${fb.answer}</span>
      </div>
      <p class="dim" style="font-size:15px">${fb.correct ? `${correctSym?.lore ?? ''}` : `The correct answer was: ${fb.answer}. Study the symbol description to remember it.`}</p>
    </div>`;
  }

  // ─── ELIMINATION ──────────────────────────────────────────────────────────

  function _renderElim(def, rec) {
    const ep = _pendingElim;
    return `<div class="dc-elim">
      <div class="dc-elim-tag-row">
        <span class="dc-elim-tag">ELIMINATION ANALYSIS</span>
        <span class="dim" style="font-size:14px">Select all symbols that appear in this address</span>
      </div>
      <div class="dc-elim-clue">${ep.clue}</div>
      <div class="dc-elim-instructions dim">
        Select the symbol(s) you believe are in this address, then submit. Symbols marked ✗ have been ruled out by previous analysis.
      </div>
      <div class="dc-elim-grid" id="elim-grid">
        ${ep.pool.map(symName => {
          const sym  = SYMBOLS.find(x => x.name === symName);
          const elim = rec.elimEliminated.includes(symName);
          const sel  = _pendingElimSel.includes(symName);
          return `<div class="dc-etile ${elim ? 'dc-etile-elim' : ''} ${sel ? 'dc-etile-sel' : ''}"
                      data-sym="${symName}"
                      onclick="Decoding.toggleElim('${symName}')"
                      title="${sym?.lore ?? symName}">
            <span class="dc-etile-g">${sym?.glyph ?? '?'}</span>
            <span class="dc-etile-n">${symName}</span>
            ${elim ? '<span class="dc-etile-x">✗</span>' : ''}
          </div>`;
        }).join('')}
      </div>
      <div class="dc-elim-actions">
        <button class="btn btn-amber" onclick="Decoding.submitElim('${def.id}')">
          Submit Analysis (${_pendingElimSel.length} selected)
        </button>
        <button class="btn btn-ghost" style="font-size:14px" onclick="Decoding.skipPuzzle()">Skip</button>
      </div>
    </div>`;
  }

  // ─── HINTS TAB ────────────────────────────────────────────────────────────

  function _renderHintsTab(s, def, rec) {
    const decoded = rec.state === ADDR.DECODED;

    const sources = [
      {
        key:     'artifact',
        label:   'Artifact Study',
        glyph:   '🏺',
        cost:    '2 Artifacts',
        avail:   s.resources.artifacts >= 2,
        desc:    'Study recovered artifacts to decode one symbol. Your science team cross-references artefact inscriptions against the DHD symbol database.',
        reveals: '1 symbol',
      },
      {
        key:     'traveller',
        label:   'Friendly Traveller',
        glyph:   '🤝',
        cost:    '5 Food',
        avail:   s.resources.food >= 5,
        desc:    'Host a gate traveller who has knowledge of this world\'s address in exchange for food and hospitality. They typically know a partial sequence.',
        reveals: '1–2 symbols',
      },
      {
        key:     'data_scan',
        label:   'Data Analysis',
        glyph:   '📡',
        cost:    '3 Data',
        avail:   s.resources.data >= 3,
        desc:    'Run the recovered data archive through automated address-matching algorithms. The system searches for partial address patterns.',
        reveals: '2 symbols',
      },
    ].map(src => `
      <div class="dc-hint-src ${decoded || !src.avail ? 'dc-hint-dim' : ''}">
        <div class="dc-hs-header">
          <span class="dc-hs-glyph">${src.glyph}</span>
          <div class="dc-hs-info">
            <div class="dc-hs-label">${src.label}</div>
            <div class="dim" style="font-size:13px">Cost: ${src.cost} · Reveals: ${src.reveals}</div>
          </div>
          <button class="btn btn-olive dc-hs-btn"
                  ${decoded || !src.avail ? 'disabled' : ''}
                  onclick="Decoding.useHint('${src.key}', '${def.id}')">
            ${decoded ? 'Done' : !src.avail ? 'Need more' : 'Use'}
          </button>
        </div>
        <div class="dc-hs-desc dim">${src.desc}</div>
      </div>`).join('');

    const history = rec.hintLog.length
      ? rec.hintLog.slice().reverse().map(h => `
        <div class="dc-hist-row">
          <span class="dim">Day ${h.day} · ${h.source.replace(/_/g,' ')}</span>
          <span class="dc-hist-syms">
            ${h.symbols.length
              ? h.symbols.map(n => `${SYMBOLS.find(x=>x.name===n)?.glyph??''} ${n}`).join(' · ')
              : 'rumour only'}
          </span>
        </div>`).join('')
      : '<p class="dim" style="padding:8px 0">No intel received yet.</p>';

    return `
      <div class="dc-hints-layout">
        <div>
          <div class="dc-sec-title">Hint Sources</div>
          ${sources}
        </div>
        <div>
          <div class="dc-sec-title">Intel History</div>
          <div class="dc-hist-list">${history}</div>
        </div>
      </div>`;
  }

  // ─── ANCIENT DB SEARCH VIEW ───────────────────────────────────────────────

  function _renderDbSearch(s, container) {
    const hasResearch = s.research.researched.includes('ancient_db_search');
    const atCost = s.resources.ancientTech;

    // All known keywords grouped by world (for hint chips)
    const allKeywords = DB_ENTRIES.flatMap(e => e.keywords.slice(0,2));

    const resultHtml = _dbResult ? _renderDbResult(_dbResult, s) : '';

    container.innerHTML = `
      <div class="dc-layout">
        <div class="dc-back-bar">
          <button class="btn btn-ghost" style="font-size:14px" onclick="Gate.closeAddressDecode()">← Back to Gate</button>
        </div>
        <div class="dc-db-panel">
          <div class="dc-db-header">
            <span class="dc-db-glyph">⌬</span>
            <div>
              <div class="dc-db-title">Ancient Database — Keyword Search</div>
              <div class="dim" style="font-size:14px">
                ${hasResearch
                  ? `Search for partial gate address fragments. Cost: 1 Ancient Tech per query. Available: ${atCost}.`
                  : 'Complete "Ancient Database Keyword Search" research to unlock this system.'}
              </div>
            </div>
          </div>
          ${!hasResearch
            ? `<div class="dc-db-locked">
                <p>This terminal requires the <strong>Ancient Database Keyword Search</strong> research to be operational.</p>
                <p class="dim">Research it in the Research Lab to unlock keyword-based address recovery.</p>
              </div>`
            : `<div class="dc-db-search-row">
                <input id="dc-kw-input" class="dc-kw-input" type="text"
                       placeholder="Enter keyword — e.g. glacial, volcanic, fortress, settlement…"
                       onkeydown="if(event.key==='Enter')Decoding.runDbSearch()"/>
                <button class="btn btn-amber" onclick="Decoding.runDbSearch()">Search</button>
              </div>
              <div class="dc-kw-chips">
                <span class="dim" style="font-size:13px">SUGGESTED:</span>
                ${allKeywords.map(kw =>
                  `<span class="dc-kw-chip" onclick="Decoding.fillKw('${kw}')">${kw}</span>`
                ).join('')}
              </div>
              <div id="dc-db-result" class="dc-db-result">${resultHtml}</div>`}
        </div>
      </div>`;
  }

  function _renderDbResult(r, s) {
    if (!r.ok) {
      return `<div class="dc-db-miss">✗ ${r.error}</div>`;
    }
    const def  = r.planetDef;
    const rec  = s.decoding[r.worldId];
    const newSyms = r.reveals.map(n => {
      const sym = SYMBOLS.find(x => x.name === n);
      return `<span class="dc-db-sym-chip">${sym?.glyph ?? ''} ${n}</span>`;
    }).join('');

    return `<div class="dc-db-hit ${r.duplicate ? 'dc-db-dup' : ''}">
      <div class="dc-db-hit-head">
        <span class="dc-db-world">${def?.name ?? r.worldId}</span>
        ${r.duplicate ? '<span class="dc-db-tag dc-db-tag-dup">ALREADY SEARCHED</span>' : ''}
        ${r.reveals.length ? `<span class="dc-db-tag dc-db-tag-new">+${r.reveals.length} new</span>` : ''}
      </div>
      <div class="dc-db-excerpt">${r.excerpt}</div>
      ${r.reveals.length ? `<div class="dc-db-new-syms">Symbols identified: ${newSyms}</div>` : ''}
      ${r.newState === ADDR.DECODED
        ? `<div class="dc-db-decoded-banner">🔓 Address fully decoded — ${def?.name} added to Gate speed-dial</div>`
        : `<div class="dc-db-progress dim">${rec?.knownSymbols.length ?? 0}/6 symbols now known for ${def?.name}</div>`}
    </div>`;
  }

  // ─── Interaction handlers ─────────────────────────────────────────────────

  function openWorld(worldId) {
    _worldId   = worldId;
    _view      = 'world';
    _subView   = 'puzzle';
    _pendingRiddle = null;
    _pendingElim   = null;
    _pendingElimSel = [];
    _riddleFeedback = null;
    if (State.isReady()) renderScreen(State.get());
  }

  function backToIndex() {
    _view = 'index';
    _worldId = null;
    _pendingRiddle = null;
    _pendingElim   = null;
    _pendingElimSel = [];
    _riddleFeedback = null;
    _dbResult = null;
    // caller (Gate.closeAddressDecode) handles re-render
  }

  function setSubView(v) {
    _subView = v;
    if (State.isReady()) renderScreen(State.get());
  }

  function openDbSearch() {
    _view     = 'db_search';
    _dbResult = null;
    if (State.isReady()) renderScreen(State.get());
  }

  function skipPuzzle() {
    _pendingRiddle  = null;
    _pendingElim    = null;
    _pendingElimSel = [];
    _riddleFeedback = null;
    if (State.isReady()) renderScreen(State.get());
  }

  // Riddle answer submission
  function submitRiddle(worldId, chosen) {
    if (!State.isReady() || !_pendingRiddle) return;
    const s = State.get();
    const { sym: answer } = _pendingRiddle;
    const correct = chosen === answer;

    // Mark puzzle as done (even if wrong — prevents same riddle reappearing)
    const rec = s.decoding[worldId];
    if (rec) rec.puzzlesDone.push('riddle_' + answer);

    if (correct) {
      const r = reveal(s, worldId, [answer], 'riddle');
      Engine.log('benefit',
        `Decoding ${planetById(worldId)?.name}: riddle solved — ${SYMBOLS.find(x=>x.name===answer)?.glyph??''} ${answer} confirmed. (${rec.knownSymbols.length}/6)`
      );
      if (r.newState === ADDR.DECODED) UI.showNotification(`🔓 ${planetById(worldId)?.name} — address decoded!`, 'success');
    } else {
      Engine.log('info', `Decoding ${planetById(worldId)?.name}: riddle incorrect. Symbol ${answer} not yet confirmed.`);
    }

    _riddleFeedback = { correct, chosen, answer };
    _pendingRiddle  = null;

    // Clear feedback after 2s then re-render
    renderScreen(s);
    setTimeout(() => {
      _riddleFeedback = null;
      if (State.isReady()) renderScreen(State.get());
    }, 2000);
  }

  // Elimination toggle
  function toggleElim(symName) {
    const el = document.querySelector(`.dc-etile[data-sym="${symName}"]`);
    if (!el || el.classList.contains('dc-etile-elim')) return;
    if (_pendingElimSel.includes(symName)) {
      _pendingElimSel = _pendingElimSel.filter(s => s !== symName);
      el.classList.remove('dc-etile-sel');
    } else {
      _pendingElimSel.push(symName);
      el.classList.add('dc-etile-sel');
    }
    // Update button label
    const btn = document.querySelector('.dc-elim-actions .btn-amber');
    if (btn) btn.textContent = `Submit Analysis (${_pendingElimSel.length} selected)`;
  }

  // Elimination submit
  function submitElim(worldId) {
    if (!State.isReady() || !_pendingElim) return;
    const s    = State.get();
    const ep   = _pendingElim;
    const rec  = s.decoding[worldId];
    const def  = planetById(worldId);
    if (!rec || !def) return;

    rec.puzzlesDone.push(ep.id);

    const correct   = ep.reveals.filter(sym => _pendingElimSel.includes(sym));
    const incorrect = _pendingElimSel.filter(sym => !ep.reveals.includes(sym));

    // Add incorrect to eliminated
    incorrect.forEach(sym => { if (!rec.elimEliminated.includes(sym)) rec.elimEliminated.push(sym); });

    let msg = '';
    if (correct.length) {
      const r = reveal(s, worldId, correct, 'elimination');
      const glyphs = correct.map(n => (SYMBOLS.find(x=>x.name===n)?.glyph??'') + ' ' + n).join(', ');
      msg = `Elimination (${def.name}): ${glyphs} confirmed. (${rec.knownSymbols.length}/6)`;
      Engine.log('benefit', msg);
      if (r.newState === ADDR.DECODED) UI.showNotification(`🔓 ${def.name} — address decoded!`, 'success');
      else if (correct.length) UI.showNotification(`${correct.length} symbol(s) confirmed.`, 'success');
    }
    if (incorrect.length) {
      Engine.log('info', `Elimination (${def.name}): ${incorrect.join(', ')} ruled out.`);
    }

    _pendingElim    = null;
    _pendingElimSel = [];
    renderScreen(s);
  }

  function useHint(sourceKey, worldId) {
    if (!State.isReady()) return;
    const s = State.get();
    let r;
    const logFn = (t, m) => Engine.log(t, m);

    if (sourceKey === 'artifact')  r = grantArtifactHint(s, worldId, logFn);
    else if (sourceKey === 'traveller') r = grantTravellerHint(s, worldId, logFn);
    else if (sourceKey === 'data_scan') r = grantDataScan(s, worldId, logFn);
    else return;

    if (!r?.ok) {
      UI.showNotification(r?.error ?? 'Not enough resources.', 'warn');
    } else {
      const syms = (r.revealed ?? []).map(n => SYMBOLS.find(x=>x.name===n)?.glyph??n).join(' ');
      UI.showNotification(syms ? `Revealed: ${syms}` : 'World now rumoured.', 'success');
      _pendingRiddle = null; _pendingElim = null; // force puzzle re-selection
      renderScreen(s);
    }
  }

  function fillKw(kw) {
    const el = document.getElementById('dc-kw-input');
    if (el) { el.value = kw; el.focus(); }
  }

  function runDbSearch() {
    if (!State.isReady()) return;
    const s  = State.get();
    const el = document.getElementById('dc-kw-input');
    const kw = el?.value?.trim();
    if (!kw) { UI.showNotification('Enter a keyword to search.', 'warn'); return; }

    _dbResult = dbSearch(s, kw);

    // Re-render result section without full page reload
    const resultEl = document.getElementById('dc-db-result');
    if (resultEl) {
      resultEl.innerHTML = _renderDbResult(_dbResult, s);
    }

    if (_dbResult.ok) {
      const msg = _dbResult.reveals.length
        ? `Ancient DB: ${_dbResult.reveals.length} symbol(s) found for ${_dbResult.planetDef?.name}.`
        : `Ancient DB: no new symbols (already searched).`;
      Engine.log('benefit', msg);
      if (el) el.value = '';
    } else {
      Engine.log('info', `Ancient DB search "${kw}": ${_dbResult.error}`);
    }

    // Refresh cost display
    const costSpan = document.querySelector('.dc-db-header .dim');
    if (costSpan && _dbResult.ok !== undefined) {
      costSpan.textContent = `Search for partial gate address fragments. Cost: 1 Ancient Tech per query. Available: ${s.resources.ancientTech}.`;
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function _stateInfo(state) {
    const map = {
      [ADDR.UNKNOWN]:  { glyph: '░', label: 'Unknown' },
      [ADDR.RUMOURED]: { glyph: '◌', label: 'Rumoured' },
      [ADDR.HINTED]:   { glyph: '◑', label: 'Hinted' },
      [ADDR.FRAGMENT]: { glyph: '◕', label: 'Fragment' },
      [ADDR.DECODED]:  { glyph: '●', label: 'Decoded' },
    };
    return map[state] ?? map[ADDR.UNKNOWN];
  }

  function _resChip(glyph, label, val, threshold) {
    const low = val < threshold;
    return `<span class="dc-res-chip ${low ? 'dc-res-low' : ''}">${glyph} ${label}: ${val}</span>`;
  }

  function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ─── Dev helpers ───────────────────────────────────────────────────────────

  function unlockAll(s) {
    ensureState(s);
    PLANET_DB.forEach(def => {
      if (def.decoded) return; // already a starting world
      const rec = s.decoding[def.id];
      if (!rec) return;
      rec.knownSymbols = [...def.address];
      rec.state = ADDR.DECODED;
      _unlockForGate(s, def);
    });
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  return {
    ADDR,
    ensureState,
    reveal,
    unlockAll,
    rumour,
    dbSearch,
    grantArtifactHint,
    grantTravellerHint,
    grantDataScan,
    grantMissionIntel,
    // UI
    renderScreen,
    openWorld,
    backToIndex,
    setSubView,
    openDbSearch,
    skipPuzzle,
    submitRiddle,
    toggleElim,
    submitElim,
    useHint,
    fillKw,
    runDbSearch,
  };

})();
