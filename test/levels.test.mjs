import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LEVELS } from '../src/game/levels/index.js'
import { CHECK_HELPERS } from '../src/game/runtime/check-helpers.js'
import {
  clearedCount,
  isCleared,
  levelMode,
  isUnlocked,
  maxXpForLevel,
  nextLevel,
  playerRank,
  sortLevels,
  totalEarnedXp,
  totalPossibleXp,
  validateLevels,
} from '../src/lib/levels.js'

test('the shipped levels are internally sound', () => {
  assert.equal(validateLevels(LEVELS, { preamble: CHECK_HELPERS }), true)
})

test('every check compiles against the helper preamble', () => {
  for (const level of LEVELS) {
    for (const check of level.checks) {
      const fn = new Function(
        'doc',
        'win',
        'root',
        `"use strict";return (async function () {${CHECK_HELPERS}${check.code}})();`,
      )
      assert.equal(typeof fn, 'function', `${level.id}/${check.id}`)
    }
  }
})

test('there are fifteen levels numbered without gaps', () => {
  assert.equal(LEVELS.length, 15)
  assert.deepEqual(
    sortLevels(LEVELS).map((level) => level.ordinal),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  )
})

test('a check can wait for a frame without depending on the frame being painted', () => {
  // An iframe scrolled out of view is not painted, so its animation frames never
  // fire. Waiting on those alone hung the run, and the player was told their own
  // code had failed. Every wait needs a timer behind it.
  assert.match(CHECK_HELPERS, /setTimeout\(finish, \d+\)/)
  assert.match(CHECK_HELPERS, /requestAnimationFrame/)
  // A backtick inside the helper string would end the template literal that
  // holds it, and the whole module would stop parsing.
  assert.doesNotMatch(CHECK_HELPERS, /`/)
})

test('a check can wait for a slow value without waiting forever', () => {
  // A scroll-driven animation lands on the compositor, so the painted value can
  // trail a programmatic scroll past a fixed pause. The wait for it has to be
  // bounded all the same: a run that never returns is reported to the player as
  // their own code hanging, so the retry budget stays small.
  assert.match(CHECK_HELPERS, /function eventually\(read, ok, tries\)/)
  assert.match(CHECK_HELPERS, /tries === undefined \? \d+ : tries/)
})

test('level ids and titles are unique and dash free', () => {
  const ids = new Set(LEVELS.map((level) => level.id))
  assert.equal(ids.size, LEVELS.length)
  for (const level of LEVELS) {
    assert.doesNotMatch(level.id, /[^a-z0-9-]/, level.id)
    for (const text of [level.title, level.brief, level.starter, level.reference.html ?? '', level.reference.css ?? '']) {
      assert.doesNotMatch(text, /[\u2013\u2014]/, `${level.id} contains a dash`)
    }
    for (const check of level.checks) {
      assert.doesNotMatch(check.label, /[\u2013\u2014]/, `${level.id}/${check.id}`)
    }
  }
})

test('every level starts unsolved', () => {
  for (const level of LEVELS) {
    const answer = levelMode(level) === 'document' ? level.reference.html : level.reference.css
    assert.notEqual(
      level.starter.trim(),
      answer.trim(),
      `${level.id} ships its own answer as the starting point`,
    )
  }
})

test('a document level keeps every style in its html', () => {
  const documents = LEVELS.filter((level) => levelMode(level) === 'document')
  assert.equal(documents.length, 2)
  for (const level of documents) {
    assert.equal(level.reference.css, '', `${level.id} leaves a stray css block`)
    assert.match(level.reference.html, /<style>/)
    assert.match(level.starter, /<style>/)
  }
})

test('validateLevels rejects a document level with a separate css block', () => {
  const broken = structuredClone(LEVELS.filter((level) => levelMode(level) === 'document').slice(0, 1))
  broken[0].reference.css = 'body { color: red; }'
  assert.throws(() => validateLevels(broken), /leave css empty/)
})

test('validateLevels rejects a duplicate ordinal', () => {
  const broken = structuredClone(LEVELS.slice(0, 3))
  broken[1].ordinal = broken[0].ordinal
  assert.throws(() => validateLevels(broken), /Duplicate ordinal/)
})

test('validateLevels rejects a check that does not compile', () => {
  const broken = structuredClone(LEVELS.slice(0, 1))
  broken[0].checks[0].code = 'return ((( true'
  assert.throws(() => validateLevels(broken, { preamble: CHECK_HELPERS }), /does not compile/)
})

test('validateLevels rejects a missing reference solution', () => {
  const broken = structuredClone(LEVELS.slice(0, 1))
  broken[0].reference = {}
  assert.throws(() => validateLevels(broken), /no reference solution/)
})

test('only the first level is open to a new player', () => {
  const progress = {}
  assert.equal(isUnlocked(LEVELS, progress, 'center-a-box'), true)
  assert.equal(isUnlocked(LEVELS, progress, 'progress-bar'), false)
  assert.equal(isUnlocked(LEVELS, progress, 'sticky-nav'), false)
})

test('clearing a level opens exactly the next one', () => {
  const progress = { 'center-a-box': { cleared: true, score: 100, xp: 50, attempts: 1 } }
  assert.equal(isUnlocked(LEVELS, progress, 'progress-bar'), true)
  assert.equal(isUnlocked(LEVELS, progress, 'glow-card'), false)
})

test('unlockAll opens everything for a reviewer without changing progress', () => {
  const progress = {}
  assert.equal(isUnlocked(LEVELS, progress, 'sticky-nav', { unlockAll: true }), true)
  assert.equal(clearedCount(LEVELS, progress), 0)
})

test('nextLevel walks forward and stops at the end', () => {
  assert.equal(nextLevel(LEVELS, 'center-a-box').id, 'progress-bar')
  assert.equal(nextLevel(LEVELS, 'sticky-nav').id, 'container-card')
  const last = sortLevels(LEVELS).at(-1)
  assert.equal(nextLevel(LEVELS, last.id), null, 'the final level has nowhere to walk to')
  assert.equal(nextLevel(LEVELS, 'not-a-level'), null)
})

test('a level that was never attempted is not cleared', () => {
  assert.equal(isCleared({}, 'glow-card'), false)
  assert.equal(isCleared({ 'glow-card': { score: 100 } }, 'glow-card'), false)
  assert.equal(isCleared({ 'glow-card': { cleared: true } }, 'glow-card'), true)
})

test('totals add up across the board', () => {
  const progress = {
    'center-a-box': { xp: 50, cleared: true },
    'progress-bar': { xp: 30, cleared: false },
  }
  assert.equal(totalEarnedXp(progress), 80)
  assert.equal(totalEarnedXp({}), 0)
  assert.equal(totalPossibleXp(LEVELS), LEVELS.reduce((sum, level) => sum + level.xp, 0))
  assert.equal(maxXpForLevel(LEVELS[0]), Math.round(LEVELS[0].xp * 1.2))
})

test('the rank climbs with the xp earned', () => {
  assert.equal(playerRank(0, LEVELS).label, 'New here')
  assert.equal(playerRank(totalPossibleXp(LEVELS), LEVELS).label, 'Cleared the board')
  assert.ok(playerRank(totalPossibleXp(LEVELS) / 2, LEVELS).index > 0)
  assert.equal(playerRank(0, []).progress, 0)
})
