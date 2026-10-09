/**
 * Grading rules. Pure on purpose: no DOM, no storage, no React, so the scoring
 * that decides whether a level is cleared can be tested under plain node.
 *
 * A check's `code` is a function body that runs inside the sandbox frame with
 * `doc`, `win` and `root` in scope. It returns:
 *   true          the check passed
 *   a string      the check failed, and the string is the reason the player reads
 *   false or void the check failed with no reason, which is a level authoring bug
 */

/** How long a run may take before the speed bonus stops applying. */
export const SPEED_BONUS_WINDOW_MS = 60_000

/** The most a run can earn above its base value, from the two bonuses below. */
export const MAX_XP_MULTIPLIER = 1.2

const AUTHORING_BUG =
  'This check is written wrong and could not explain itself. Report it, it is a bug in the level, not in your code.'

/**
 * Turn whatever a check returned into a verdict the UI can render. Anything that
 * is not an explicit pass becomes a failure, so a check that silently returns
 * nothing can never be mistaken for a pass.
 */
export function normalizeOutcome(raw) {
  if (raw === true) return { ok: true, message: '' }
  if (typeof raw === 'string' && raw.trim()) return { ok: false, message: raw.trim() }
  return { ok: false, message: AUTHORING_BUG }
}

/**
 * Grade a set of checks against the raw values they returned. `rawOutcomes` is
 * keyed by check id; a check with no entry counts as failed rather than skipped.
 */
export function gradeLevel(checks, rawOutcomes = {}) {
  const list = checks.map((check) => {
    const has = Object.prototype.hasOwnProperty.call(rawOutcomes, check.id)
    const { ok, message } = normalizeOutcome(has ? rawOutcomes[check.id] : false)
    return { id: check.id, label: check.label, ok, message }
  })

  const passed = list.filter((check) => check.ok).length
  const total = list.length

  return {
    checks: list,
    passed,
    total,
    allPassed: total > 0 && passed === total,
    score: total === 0 ? 0 : Math.round((passed / total) * 100),
  }
}

/**
 * The result of a run that never produced measurements, because the frame timed
 * out or never answered.
 *
 * The checks are listed so the player can still see what the level asks for, but
 * nothing is claimed about any of them. Grading an empty outcome set the normal
 * way would mark every check failed and label each one an authoring bug, which
 * tells the player something false about both their code and the level. A run
 * that could not be measured is its own outcome, and the UI says so.
 */
export function unmeasuredLevel(checks = []) {
  return {
    checks: checks.map((check) => ({ id: check.id, label: check.label, ok: false, message: '' })),
    passed: 0,
    total: checks.length,
    allPassed: false,
    score: 0,
    unmeasured: true,
  }
}

/**
 * The experience a finished run is worth, and the breakdown that produced it.
 * Bonuses apply only to a full clear, so a messy partial run is never rewarded
 * for being fast.
 */
export function computeXp({ baseXp, score, allPassed, durationMs, attempts }) {
  const base = Number.isFinite(baseXp) ? Math.max(0, Math.round(baseXp)) : 0
  const safeScore = clamp(Math.round(score), 0, 100)
  const earned = Math.round((base * safeScore) / 100)

  if (!allPassed) {
    return { xp: earned, base, speedBonus: 0, firstTryBonus: 0, multiplier: round2(safeScore / 100) }
  }

  const speedBonus = durationMs <= SPEED_BONUS_WINDOW_MS ? Math.round(base * 0.1) : 0
  const firstTryBonus = attempts <= 1 ? Math.round(base * 0.1) : 0
  const cap = Math.round(base * MAX_XP_MULTIPLIER)

  return {
    xp: Math.min(cap, earned + speedBonus + firstTryBonus),
    base,
    speedBonus,
    firstTryBonus,
    multiplier: round2(Math.min(cap, earned + speedBonus + firstTryBonus) / base || 0),
  }
}

/**
 * Fold a finished run into a player's record for one level. Best score and best
 * xp are kept, and `attempts` only ever counts runs, so a player can retry a
 * level without losing the clear they already earned.
 */
export function mergeProgressEntry(previous, run) {
  const prior = previous ?? { score: 0, xp: 0, attempts: 0, cleared: false, bestDurationMs: null }
  const attempts = prior.attempts + 1
  const score = Math.max(prior.score, run.score)
  const xp = Math.max(prior.xp, run.xp)
  const cleared = prior.cleared || run.allPassed

  const bestDurationMs =
    run.allPassed && (prior.bestDurationMs === null || run.durationMs < prior.bestDurationMs)
      ? run.durationMs
      : prior.bestDurationMs

  return { score, xp, attempts, cleared, bestDurationMs }
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '0.0s'
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${String(Math.round(seconds % 60)).padStart(2, '0')}s`
}

function clamp(value, low, high) {
  return Math.min(high, Math.max(low, value))
}

function round2(value) {
  return Math.round(value * 100) / 100
}
