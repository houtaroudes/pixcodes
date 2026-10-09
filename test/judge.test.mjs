import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  MAX_XP_MULTIPLIER,
  SPEED_BONUS_WINDOW_MS,
  computeXp,
  formatDuration,
  gradeLevel,
  mergeProgressEntry,
  normalizeOutcome,
  unmeasuredLevel,
} from '../src/lib/judge.js'

const checks = [
  { id: 'a', label: 'First' },
  { id: 'b', label: 'Second' },
  { id: 'c', label: 'Third' },
  { id: 'd', label: 'Fourth' },
]

test('only an explicit true is a pass', () => {
  assert.deepEqual(normalizeOutcome(true), { ok: true, message: '' })
  assert.equal(normalizeOutcome('Add a border.').ok, false)
  assert.equal(normalizeOutcome('Add a border.').message, 'Add a border.')
  assert.equal(normalizeOutcome(false).ok, false)
  assert.equal(normalizeOutcome(undefined).ok, false)
  assert.equal(normalizeOutcome(null).ok, false)
  assert.equal(normalizeOutcome('').ok, false)
  assert.equal(normalizeOutcome({ ok: true }).ok, false)
})

test('a run that was never measured claims nothing about any check', () => {
  const verdict = unmeasuredLevel(checks)
  assert.equal(verdict.unmeasured, true)
  assert.equal(verdict.passed, 0)
  assert.equal(verdict.total, 4)
  assert.equal(verdict.score, 0)
  assert.equal(verdict.allPassed, false)
  assert.equal(verdict.checks.length, 4)
  for (const check of verdict.checks) {
    // An empty message is the point: the old path filled this with the authoring
    // bug text and told the player their level was broken.
    assert.equal(check.message, '')
    assert.equal(check.ok, false)
  }
  assert.deepEqual(
    verdict.checks.map((check) => check.label),
    ['First', 'Second', 'Third', 'Fourth'],
  )
})

test('an unmeasured level is not the same shape as a failed one', () => {
  const failed = gradeLevel(checks, {})
  const unmeasured = unmeasuredLevel(checks)
  assert.equal(failed.unmeasured, undefined)
  assert.equal(unmeasured.unmeasured, true)
  assert.match(failed.checks[0].message, /written wrong/)
  assert.equal(unmeasured.checks[0].message, '')
})

test('a check that returns nothing fails instead of passing silently', () => {
  const verdict = gradeLevel([{ id: 'a', label: 'First' }], { a: undefined })
  assert.equal(verdict.checks[0].ok, false)
  assert.match(verdict.checks[0].message, /written wrong/)
})

test('a missing outcome counts as a failure, not a skip', () => {
  const verdict = gradeLevel(checks, { a: true, b: true })
  assert.equal(verdict.passed, 2)
  assert.equal(verdict.total, 4)
  assert.equal(verdict.allPassed, false)
  assert.equal(verdict.score, 50)
})

test('a full clear passes and scores 100', () => {
  const verdict = gradeLevel(checks, { a: true, b: true, c: true, d: true })
  assert.equal(verdict.allPassed, true)
  assert.equal(verdict.score, 100)
})

test('the failure reason survives grading', () => {
  const verdict = gradeLevel(checks, { a: true, b: 'Set display: flex on the body.', c: true, d: true })
  assert.equal(verdict.checks[1].ok, false)
  assert.equal(verdict.checks[1].message, 'Set display: flex on the body.')
  assert.equal(verdict.checks[1].label, 'Second')
  assert.equal(verdict.score, 75)
})

test('a level with no checks can never be cleared', () => {
  const verdict = gradeLevel([], {})
  assert.equal(verdict.allPassed, false)
  assert.equal(verdict.score, 0)
})

test('partial runs earn xp in proportion and no bonus', () => {
  const result = computeXp({ baseXp: 80, score: 50, allPassed: false, durationMs: 1000, attempts: 1 })
  assert.equal(result.xp, 40)
  assert.equal(result.speedBonus, 0)
  assert.equal(result.firstTryBonus, 0)
})

test('a fast first-try clear takes both bonuses and stops at the cap', () => {
  const result = computeXp({
    baseXp: 100,
    score: 100,
    allPassed: true,
    durationMs: SPEED_BONUS_WINDOW_MS - 1,
    attempts: 1,
  })
  assert.equal(result.speedBonus, 10)
  assert.equal(result.firstTryBonus, 10)
  assert.equal(result.xp, Math.round(100 * MAX_XP_MULTIPLIER))
})

test('a slow retried clear earns the base only', () => {
  const result = computeXp({
    baseXp: 60,
    score: 100,
    allPassed: true,
    durationMs: SPEED_BONUS_WINDOW_MS + 1,
    attempts: 4,
  })
  assert.equal(result.speedBonus, 0)
  assert.equal(result.firstTryBonus, 0)
  assert.equal(result.xp, 60)
})

test('a nonsense xp figure does not produce a negative or NaN award', () => {
  assert.equal(computeXp({ baseXp: Number.NaN, score: 100, allPassed: false }).xp, 0)
  assert.equal(computeXp({ baseXp: -50, score: 100, allPassed: false }).xp, 0)
  assert.equal(computeXp({ baseXp: 50, score: 500, allPassed: false }).xp, 50)
})

test('the best score and the clear survive a worse retry', () => {
  const first = mergeProgressEntry(undefined, { score: 100, xp: 60, allPassed: true, durationMs: 30_000 })
  assert.deepEqual(first, { score: 100, xp: 60, attempts: 1, cleared: true, bestDurationMs: 30_000 })

  const second = mergeProgressEntry(first, { score: 25, xp: 15, allPassed: false, durationMs: 90_000 })
  assert.equal(second.score, 100)
  assert.equal(second.xp, 60)
  assert.equal(second.cleared, true)
  assert.equal(second.attempts, 2)
  assert.equal(second.bestDurationMs, 30_000)
})

test('a faster clear replaces the recorded best time', () => {
  const first = mergeProgressEntry(undefined, { score: 100, xp: 50, allPassed: true, durationMs: 40_000 })
  const faster = mergeProgressEntry(first, { score: 100, xp: 55, allPassed: true, durationMs: 12_000 })
  assert.equal(faster.bestDurationMs, 12_000)
  assert.equal(faster.xp, 55)
})

test('a failed run does not record a best time', () => {
  const entry = mergeProgressEntry(undefined, { score: 60, xp: 30, allPassed: false, durationMs: 5_000 })
  assert.equal(entry.bestDurationMs, null)
})

test('durations read as seconds and as minutes', () => {
  assert.equal(formatDuration(0), '0.0s')
  assert.equal(formatDuration(9500), '9.5s')
  assert.equal(formatDuration(60_000), '1m 00s')
  assert.equal(formatDuration(95_000), '1m 35s')
  assert.equal(formatDuration(Number.NaN), '0.0s')
})
