/**
 * STARGATE: REMNANTS — Planet Database
 * All known gate addresses, biomes, world descriptions, and mission templates.
 * Starting worlds unlocked from the beginning; others require decoding.
 *
 * address: array of 6 symbol names from SYMBOLS — must match names in data/symbols.js
 * The Point of Origin (symbol 38: 'origin') is always appended automatically when dialing.
 */

const PLANET_DB = Object.freeze([

  // ── Starting world: decoded from day 1 ─────────────────────────────────
  {
    id:       'p3x_001',
    name:     'P3X-001',
    address:  ['lion', 'water', 'bull', 'eye', 'nebula', 'sun'],
    decoded:  true,
    biome:    'plains',
    threat:   'low',
    description: 'A windswept grassland world with ruins of a long-dead civilisation. Grass sways in constant wind. Broken stone columns jut from the earth.',
    lore:     'Once home to a Goa\'uld servant population, P3X-001 was abandoned centuries ago. The people left behind learned to survive.',
    atmosphere: 'Breathable. Temperate. Dust storms in the southern hemisphere.',
    resources: {
      food:       { chance: 0.8, amount: [8, 20] },
      rarePlants:  { chance: 0.4, amount: [1, 4] },
      artifacts:   { chance: 0.3, amount: [1, 3] },
      naquadah:    { chance: 0.4, amount: [4, 10] },
    },
    missions: ['scout', 'forage', 'excavate', 'diplomacy', 'research', 'medical_harvest', 'data_download'],
    events: [
      { weight: 30, type: 'neutral',  msg: 'Wind sweeps across the ruined plaza. Dust devils spiral between broken pillars.' },
      { weight: 20, type: 'neutral',  msg: 'A herd of large ungulates watches from a ridge, then vanishes over the horizon.' },
      { weight: 20, type: 'benefit',  msg: 'A cache of pre-Goa\'uld pottery is found in a buried chamber. Archaeological value noted.' },
      { weight: 15, type: 'danger',   msg: 'Jaffa patrol tracks detected — recent boot impressions in the dust. Someone is watching.' },
      { weight: 15, type: 'danger',   msg: 'A sudden dust storm reduces visibility to near zero. Navigation becomes treacherous.' },
    ],
  },

  // ── Ice world ──────────────────────────────────────────────────────────
  {
    id:       'p4c_227',
    name:     'P4C-227',
    address:  ['mountain', 'comet', 'crown', 'serpent', 'anchor', 'star'],
    decoded:  false,
    biome:    'ice',
    threat:   'medium',
    description: 'A glacial world locked in perpetual winter. The gate sits at the edge of a vast frozen sea, ringed by towering ice formations that fracture the light into cold rainbows.',
    lore:     'The Ancients maintained a research outpost here millennia ago. Signs of their presence — crystalline structures of unknown purpose — persist beneath the ice.',
    atmosphere: 'Thin but breathable. Extreme cold. Visibility poor during blizzards.',
    resources: {
      crystals:    { chance: 0.7, amount: [4, 12] },
      ancientTech:  { chance: 0.3, amount: [1, 3] },
      alloys:      { chance: 0.2, amount: [2, 5] },
    },
    missions: ['scout', 'excavate', 'tech_salvage', 'research', 'mining', 'data_download'],
    events: [
      { weight: 35, type: 'neutral',  msg: 'Ice groans and shifts underfoot. The entire world seems to breathe.' },
      { weight: 20, type: 'danger',   msg: 'A crevasse opens without warning. The team barely avoids falling.' },
      { weight: 20, type: 'benefit',  msg: 'An Ancient crystal array is found intact beneath a glacier shelf. Data is recoverable.' },
      { weight: 15, type: 'danger',   msg: 'A blizzard moves in. Temperature plummets. The gate is buried under drifting snow.' },
      { weight: 10, type: 'neutral',  msg: 'Strange bioluminescent organisms pulse beneath the ice. Life, but not as we know it.' },
    ],
  },

  // ── Jungle world ──────────────────────────────────────────────────────
  {
    id:       'p5s_117',
    name:     'P5S-117',
    address:  ['tree', 'moon', 'scarab', 'flame', 'hand', 'eclipse'],
    decoded:  false,
    biome:    'jungle',
    threat:   'medium',
    description: 'A world of vast tropical forests where vegetation has reclaimed every ancient structure. The air is heavy with moisture and the calls of unseen creatures.',
    lore:     'The Nox are rumoured to have lived here once. The jungle carries a stillness that feels deliberate — as though the forest itself is aware.',
    atmosphere: 'Dense, humid. High oxygen content causes slight euphoria. Breathable.',
    resources: {
      food:        { chance: 0.9, amount: [10, 25] },
      rarePlants:  { chance: 0.7, amount: [3, 8] },
      medicine:    { chance: 0.5, amount: [2, 6] },
      artifacts:   { chance: 0.3, amount: [1, 4] },
    },
    missions: ['forage', 'scout', 'diplomacy', 'medical_harvest', 'research', 'excavate', 'trade'],
    events: [
      { weight: 30, type: 'neutral',  msg: 'Phosphorescent fungi light the forest floor in shades of blue and green.' },
      { weight: 25, type: 'benefit',  msg: 'Dense medicinal plant life — samples taken. The base medic will be pleased.' },
      { weight: 20, type: 'danger',   msg: 'A native predator stalks the team through the undergrowth. The jungle goes silent.' },
      { weight: 15, type: 'danger',   msg: 'Ancient stone ruins are trapped with Goa\'uld failsafes. One wrong step triggers a discharge.' },
      { weight: 10, type: 'benefit',  msg: 'An elder of a hidden tribe offers healing herbs in exchange for shared knowledge.' },
    ],
  },

  // ── Desert world ──────────────────────────────────────────────────────
  {
    id:       'p2r_890',
    name:     'P2R-890',
    address:  ['desert', 'sun', 'skull', 'naquadah', 'spiral', 'tower'],
    decoded:  false,
    biome:    'desert',
    threat:   'high',
    description: 'A scorched wasteland of rust-red dunes and shattered mesas. The sky burns a deep orange. Nothing grows here but the ruins of a once-mighty empire.',
    lore:     'This was a Goa\'uld mining world. The naquadah veins run deep. The System Lord who claimed it is gone — but the automated defences remain.',
    atmosphere: 'Thin and scorching. Dust laden. Breathable with filtration.',
    resources: {
      naquadah:    { chance: 0.8, amount: [8, 20] },
      alloys:      { chance: 0.5, amount: [3, 8] },
      artifacts:   { chance: 0.4, amount: [2, 6] },
      advancedTech: { chance: 0.2, amount: [1, 3] },
    },
    missions: ['mining', 'scout', 'sabotage', 'tech_salvage', 'excavate', 'research', 'data_download'],
    events: [
      { weight: 30, type: 'danger',   msg: 'A Jaffa automated sentry drone activates. It has not forgotten its programming.' },
      { weight: 25, type: 'benefit',  msg: 'A collapsed mine shaft reveals a vein of naquadah close to the surface. Jackpot.' },
      { weight: 20, type: 'neutral',  msg: 'Wind-carved rock formations whistle with an eerie, almost musical tone.' },
      { weight: 15, type: 'danger',   msg: 'The heat is extraordinary. Team members suffer dehydration effects mid-mission.' },
      { weight: 10, type: 'benefit',  msg: 'Abandoned Goa\'uld tech cache found intact in a buried vault. Significant haul.' },
    ],
  },

  // ── Inhabited world — friendly ────────────────────────────────────────
  {
    id:       'p7x_044',
    name:     'P7X-044',
    address:  ['house', 'heart', 'water', 'star', 'bridge', 'moon'],
    decoded:  false,
    biome:    'inhabited',
    threat:   'low',
    description: 'A lush agricultural world with a settled human population descended from Egyptian-era transplants. Their civilisation is peaceful and advanced enough to have driven off Goa\'uld interest.',
    lore:     'The people of Kheb\'ar call themselves the Freemen. They have long memories of the gods who enslaved their ancestors, and a burning desire to never be ruled again.',
    atmosphere: 'Ideal. Warm, stable climate. Feels like home.',
    resources: {
      food:        { chance: 0.9, amount: [15, 35] },
      medicine:    { chance: 0.6, amount: [3, 8] },
      alloys:      { chance: 0.4, amount: [2, 7] },
      artifacts:   { chance: 0.3, amount: [1, 4] },
    },
    missions: ['diplomacy', 'trade', 'forage', 'alliance', 'medical_harvest', 'research', 'scout'],
    events: [
      { weight: 35, type: 'benefit',  msg: 'The elders of Kheb\'ar offer food stores and medical supplies in exchange for shared intelligence on the Goa\'uld.' },
      { weight: 25, type: 'neutral',  msg: 'A harvest festival is underway in the main settlement. The team is welcomed as guests.' },
      { weight: 20, type: 'benefit',  msg: 'A local artisan demonstrates alloy-working techniques not seen in any SGC database.' },
      { weight: 15, type: 'neutral',  msg: 'An elder tells of a nearby world with "cold fire underground" — possible naquadah deposit.' },
      { weight: 5,  type: 'danger',   msg: 'A faction of isolationists confronts the team. Relations require careful handling.' },
    ],
  },

  // ── Volcanic world ────────────────────────────────────────────────────
  {
    id:       'p9v_312',
    name:     'P9V-312',
    address:  ['flame', 'storm', 'mountain', 'naquadah', 'quantum', 'ascension'],
    decoded:  false,
    biome:    'volcanic',
    threat:   'very_high',
    description: 'A world in active geological upheaval. Lava rivers cut through obsidian plains. The gate stands on a plateau of cooled basalt, surrounded by the roar of venting geysers.',
    lore:     'The gate itself is a puzzle — who dialed in to this hellhole, and why? Ancient survey markers suggest a massive naquadah deposit, possibly the richest outside Chulak.',
    atmosphere: 'Toxic without filtration. Extreme heat. The team\'s life signs equipment fights sensor interference from the magnetic field.',
    resources: {
      naquadah:    { chance: 0.9, amount: [15, 30] },
      alloys:      { chance: 0.6, amount: [5, 12] },
      crystals:    { chance: 0.4, amount: [3, 8] },
    },
    missions: ['mining', 'scout', 'tech_salvage', 'sabotage', 'research', 'excavate'],
    events: [
      { weight: 35, type: 'danger',   msg: 'A lava surge forces the team to higher ground. The retreat is harrowing.' },
      { weight: 25, type: 'danger',   msg: 'Toxic gas venting from a new fissure. Filters are working overtime.' },
      { weight: 20, type: 'benefit',  msg: 'A cooling lava tube leads to an enormous crystallised naquadah pocket. The readings are off the charts.' },
      { weight: 10, type: 'neutral',  msg: 'Geological sensors record the formation of a new island on the lava sea below.' },
      { weight: 10, type: 'danger',   msg: 'Seismic event — minor eruption. The gate is temporarily buried under ash fall.' },
    ],
  },

  // ── Ancient outpost ───────────────────────────────────────────────────
  {
    id:       'p1a_ancient',
    name:     'Anquietas',
    address:  ['ascension', 'zpm', 'quantum', 'infinity', 'star', 'gate'],
    decoded:  false,
    biome:    'ancient_outpost',
    threat:   'low',
    description: 'A world of white stone and silence. The architecture is unmistakably Ancient — tall arched structures covered in the flowing script of the Ancients, preserved against all entropy.',
    lore:     'This was an outpost of the Lanteans before their exodus to Pegasus. The DHD here is specially configured — it alone holds the address to Atlantis encoded in its memory crystal.',
    atmosphere: 'Perfect. Artificially maintained by systems still running after ten thousand years.',
    resources: {
      data:        { chance: 0.9, amount: [10, 25] },
      ancientTech:  { chance: 0.8, amount: [3, 8] },
      artifacts:    { chance: 0.7, amount: [3, 8] },
      crystals:     { chance: 0.5, amount: [3, 7] },
    },
    missions: ['research', 'tech_salvage', 'excavate', 'data_download', 'scout', 'medical_harvest'],
    specialReward: 'pegasus_address',
    events: [
      { weight: 40, type: 'benefit',  msg: 'Ancient data archives yield operational schematics for unknown technologies. This will take months to catalogue.' },
      { weight: 25, type: 'neutral',  msg: 'The lights in the outpost pulse in a complex, repeating pattern. The base AI seems to be greeting you.' },
      { weight: 20, type: 'benefit',  msg: 'A dormant ZPM cradle is found. No module present — but the cradle itself is of immense value.' },
      { weight: 15, type: 'neutral',  msg: 'A holographic message from an Ancient plays on loop, describing the fall of their empire with quiet grief.' },
    ],
  },

  // ── Gas giant moon — dangerous ────────────────────────────────────────
  {
    id:       'p6m_ghost',
    name:     'P6M-Ghost',
    address:  ['wolf', 'nebula', 'skull', 'eclipse', 'hourglass', 'key'],
    decoded:  false,
    biome:    'moon',
    threat:   'very_high',
    description: 'A small moon orbiting a vast gas giant. The gas giant fills a third of the sky, banded in amber and violet. Ruins of a Goa\'uld fortress cover an entire plateau — stripped, but not looted.',
    lore:     'P6M-Ghost earned its designation when an entire survey team disappeared without trace. Their last transmission mentioned lights in the old fortress. The gate is still open.',
    atmosphere: 'Thin. Breathable with some difficulty. Radiation from the gas giant requires suit filtration.',
    resources: {
      alloys:      { chance: 0.6, amount: [5, 12] },
      advancedTech: { chance: 0.5, amount: [2, 6] },
      naniteTech:  { chance: 0.2, amount: [1, 2] },
      artifacts:   { chance: 0.4, amount: [2, 5] },
    },
    missions: ['scout', 'sabotage', 'tech_salvage', 'excavate', 'mining', 'research', 'data_download'],
    events: [
      { weight: 30, type: 'danger',   msg: 'Something is in the fortress. Movement detected on sensors — bipedal, but not registering as organic.' },
      { weight: 25, type: 'danger',   msg: 'A replicator fragment is found. Apparently inert. Taking no chances — it is destroyed immediately.' },
      { weight: 20, type: 'benefit',  msg: 'Goa\'uld armament caches found intact. Advanced technology, untouched.' },
      { weight: 15, type: 'neutral',  msg: 'The gas giant\'s aurora fills the sky with ribbons of emerald and gold. Staggeringly beautiful.' },
      { weight: 10, type: 'danger',   msg: 'A resonance pulse from the fortress disorients the team. Navigation systems scramble.' },
    ],
  },

]);

/**
 * Look up a planet definition by world ID.
 * @param {string} id
 * @returns {object|undefined}
 */
function planetById(id) {
  return PLANET_DB.find(p => p.id === id);
}

/**
 * Find a world def by its address (array of symbol names).
 * @param {string[]} address
 * @returns {object|undefined}
 */
function planetByAddress(address) {
  if (!address || address.length < 6) return undefined;
  const key = address.slice(0, 6).sort().join(',');
  return PLANET_DB.find(p => {
    const pKey = [...p.address].sort().join(',');
    return pKey === key;
  });
}
