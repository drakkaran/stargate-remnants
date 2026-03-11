/**
 * STARGATE: REMNANTS — Gate Symbols
 * 39 unique symbols for the Stargate dialing system.
 * Each symbol has a unique text-based glyph (SVG path placeholder),
 * a canonical name, a display character, and a thematic category.
 * The 39th symbol (index 38) is the Point of Origin — fixed to the home gate.
 *
 * Full glyph SVG art: Phase 3 (Gate screen).
 * Here we define the data layer used by the gate and decoding systems.
 */

const SYMBOLS = Object.freeze([
  // ── Celestial ─────────────────────────────────────────────────
  { id:  0, name: 'sun',       glyph: '☀',  category: 'celestial',  lore: 'The life-giving star — source of all energy.' },
  { id:  1, name: 'moon',      glyph: '☽',  category: 'celestial',  lore: 'The wandering disc that governs tides and time.' },
  { id:  2, name: 'star',      glyph: '✦',  category: 'celestial',  lore: 'A distant sun — waypoint of navigators.' },
  { id:  3, name: 'comet',     glyph: '☄',  category: 'celestial',  lore: 'Fire across the void — an omen of change.' },
  { id:  4, name: 'nebula',    glyph: '𝌊',  category: 'celestial',  lore: 'The birthplace of stars — swirling cosmic gas.' },
  { id:  5, name: 'eclipse',   glyph: '◉',  category: 'celestial',  lore: 'Sun consumed by moon — a moment of perfect alignment.' },

  // ── Earth & Nature ────────────────────────────────────────────
  { id:  6, name: 'water',     glyph: '≋',  category: 'nature',     lore: 'The endless ocean — cradle of life.' },
  { id:  7, name: 'mountain',  glyph: '⛰',  category: 'nature',     lore: 'Immovable stone — the backbone of worlds.' },
  { id:  8, name: 'tree',      glyph: '⍋',  category: 'nature',     lore: 'Root and branch — the cycle of growth.' },
  { id:  9, name: 'desert',    glyph: '⌇',  category: 'nature',     lore: 'Endless sand — the patience of stone.' },
  { id: 10, name: 'storm',     glyph: '⚡',  category: 'nature',     lore: 'Lightning born of sky — raw power unleashed.' },
  { id: 11, name: 'flame',     glyph: '🜂',  category: 'nature',     lore: 'The consuming fire — both destroyer and purifier.' },

  // ── Creatures ─────────────────────────────────────────────────
  { id: 12, name: 'lion',      glyph: '𓁁',  category: 'creature',   lore: 'The hunter-king — strength and dominion.' },
  { id: 13, name: 'bull',      glyph: '♉',  category: 'creature',   lore: 'The great horned beast — endurance and labour.' },
  { id: 14, name: 'serpent',   glyph: '𓆙',  category: 'creature',   lore: 'The eternal coil — wisdom and danger entwined.' },
  { id: 15, name: 'eagle',     glyph: '⍊',  category: 'creature',   lore: 'The soaring eye — sight beyond horizons.' },
  { id: 16, name: 'wolf',      glyph: '⊗',  category: 'creature',   lore: 'The pack hunter — loyalty and cunning.' },
  { id: 17, name: 'scarab',    glyph: '𓆣',  category: 'creature',   lore: 'The sacred beetle — rebirth and transformation.' },

  // ── Human / Body ──────────────────────────────────────────────
  { id: 18, name: 'eye',       glyph: '𓁹',  category: 'human',      lore: 'The all-seeing eye — knowledge and vigilance.' },
  { id: 19, name: 'hand',      glyph: '𓂧',  category: 'human',      lore: 'The reaching hand — creation and intent.' },
  { id: 20, name: 'crown',     glyph: '♕',  category: 'human',      lore: 'The mark of rulership — authority and burden.' },
  { id: 21, name: 'skull',     glyph: '☠',  category: 'human',      lore: 'Death and memory — the cost of knowledge.' },
  { id: 22, name: 'heart',     glyph: '♡',  category: 'human',      lore: 'The seat of courage — will and sacrifice.' },

  // ── Structures ────────────────────────────────────────────────
  { id: 23, name: 'tomb',      glyph: '⊞',  category: 'structure',  lore: 'The sealed chamber — secrets waiting in stone.' },
  { id: 24, name: 'house',     glyph: '⌂',  category: 'structure',  lore: 'The hearth and hall — shelter and community.' },
  { id: 25, name: 'tower',     glyph: '⏣',  category: 'structure',  lore: 'The rising spire — ambition reaching skyward.' },
  { id: 26, name: 'gate',      glyph: '⊡',  category: 'structure',  lore: 'The threshold — passage between worlds.' },
  { id: 27, name: 'bridge',    glyph: '≡',  category: 'structure',  lore: 'The span across — connection over distance.' },

  // ── Symbols & Concepts ────────────────────────────────────────
  { id: 28, name: 'hourglass', glyph: '⧗',  category: 'concept',    lore: 'Time measured in falling sand — the urgency of now.' },
  { id: 29, name: 'infinity',  glyph: '∞',  category: 'concept',    lore: 'The endless loop — Ancient mathematics made symbol.' },
  { id: 30, name: 'scales',    glyph: '⚖',  category: 'concept',    lore: 'Justice in balance — equal measure of all things.' },
  { id: 31, name: 'anchor',    glyph: '⚓',  category: 'concept',    lore: 'Fixed and grounded — the point that holds.' },
  { id: 32, name: 'key',       glyph: '⚿',  category: 'concept',    lore: 'Lock and liberation — the answer hidden in form.' },
  { id: 33, name: 'spiral',    glyph: '🌀',  category: 'concept',    lore: 'The galaxy\'s shape — growth turning back on itself.' },

  // ── Ancient ───────────────────────────────────────────────────
  { id: 34, name: 'naquadah',  glyph: '⎊',  category: 'ancient',    lore: 'The element that powers the gate — heavy and radiant.' },
  { id: 35, name: 'ascension', glyph: '⍾',  category: 'ancient',    lore: 'The path beyond flesh — what the Ancients became.' },
  { id: 36, name: 'zpm',       glyph: '⌬',  category: 'ancient',    lore: 'Zero-point module — a universe\'s energy bottled.' },
  { id: 37, name: 'quantum',   glyph: '⊛',  category: 'ancient',    lore: 'The subatomic truth — matter as information.' },

  // ── Point of Origin (always index 38, home symbol) ───────────
  { id: 38, name: 'origin',    glyph: '⊕',  category: 'origin',     lore: 'The mark of home — where this gate stands in the cosmos.' },
]);

/**
 * Quick lookup: get a symbol by name.
 * @param {string} name
 * @returns {object|undefined}
 */
function symbolByName(name) {
  return SYMBOLS.find(s => s.name === name);
}

/**
 * Quick lookup: get a symbol by id.
 * @param {number} id
 * @returns {object|undefined}
 */
function symbolById(id) {
  return SYMBOLS[id];
}

/**
 * All symbols except the Point of Origin — used for address building.
 * @returns {object[]}
 */
function dialableSymbols() {
  return SYMBOLS.filter(s => s.category !== 'origin');
}
