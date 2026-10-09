/**
 * Level rules. Pure: ordering, unlocking and totals, with no storage or React.
 *
 * Unlocking is deliberately strict. A level opens the next one only when every
 * check passes, because a half-finished level that already unlocked the next
 * would let the map fill with levels that were never actually solved. An
 * explicit `unlockAll` flag exists so the whole game can be reviewed without
 * replaying it, and it is the reviewer's affordance rather than the game's.
 */

/**
 * How the player's answer is measured.
 *
 * `css` renders fixed markup from the reference and lets the player style it.
 * `document` hands over the whole document, which a level needs when the markup
 * or a script is part of the answer.
 */
export const LEVEL_MODES = ['css', 'document']

export function levelMode(level) {
  return level?.mode ?? 'css'
}

export function sortLevels(levels) {
  return [...levels].sort((a, b) => a.ordinal - b.ordinal)
}

/**
 * Fail loudly on a bad level spec. Called by the tests over the real level set,
 * so an authoring typo breaks the test run instead of silently shipping a level
 * whose checks can never pass.
 */
export function validateLevels(levels, { preamble = '' } = {}) {
  if (!Array.isArray(levels) || levels.length === 0) {
    throw new Error('A level set needs at least one level.')
  }

  const seenIds = new Set()
  const seenOrdinals = new Set()

  for (const level of levels) {
    const where = level && level.id ? `level "${level.id}"` : 'a level with no id'

    for (const field of ['id', 'title', 'brief', 'starter', 'tier']) {
      if (level?.[field] === undefined || level?.[field] === '') {
        throw new Error(`${where} is missing "${field}".`)
      }
    }
    if (seenIds.has(level.id)) throw new Error(`Duplicate level id "${level.id}".`)
    if (seenOrdinals.has(level.ordinal)) throw new Error(`Duplicate ordinal ${level.ordinal}.`)
    if (!Number.isInteger(level.ordinal) || level.ordinal < 1) {
      throw new Error(`${where} needs a positive integer ordinal.`)
    }
    if (!Number.isFinite(level.xp) || level.xp <= 0) {
      throw new Error(`${where} needs a positive xp value.`)
    }
    if (!level.reference?.html && !level.reference?.css) {
      throw new Error(`${where} has no reference solution to render as the target.`)
    }

    const mode = levelMode(level)
    if (!LEVEL_MODES.includes(mode)) {
      throw new Error(`${where} has mode "${mode}", which is not one of ${LEVEL_MODES.join(' or ')}.`)
    }
    if (mode === 'document') {
      if (level.reference.css !== '') {
        throw new Error(`${where} is a document level, so its reference must carry every style inside the html and leave css empty.`)
      }
      if (!/<(html|body|style|script)/i.test(level.starter)) {
        throw new Error(`${where} is a document level, so its starter needs to be a whole document.`)
      }
    } else if (!level.reference.html) {
      throw new Error(`${where} styles fixed markup, so it needs a reference html for the player to see.`)
    }
    if (!Array.isArray(level.checks) || level.checks.length === 0) {
      throw new Error(`${where} has no checks.`)
    }

    const checkIds = new Set()
    for (const check of level.checks) {
      if (!check.id || !check.label || !check.code) {
        throw new Error(`${where} has a check missing id, label or code.`)
      }
      if (checkIds.has(check.id)) throw new Error(`${where} has duplicate check id "${check.id}".`)
      checkIds.add(check.id)
      assertCodeCompiles(check, where, preamble)
    }

    seenIds.add(level.id)
    seenOrdinals.add(level.ordinal)
  }

  const ordinals = sortLevels(levels).map((level) => level.ordinal)
  ordinals.forEach((ordinal, index) => {
    if (ordinal !== index + 1) {
      throw new Error(`Ordinals must run 1..${levels.length} with no gaps, got ${ordinals.join(', ')}.`)
    }
  })

  return true
}

/**
 * The `code` string is parsed by `new Function` at run time, so a syntax error
 * would only surface when a player reached that level. Compiling it here moves
 * that failure into the test run.
 */
/**
 * Compile a check exactly the way the sandbox does, including the async wrapper,
 * so a typo breaks the test run instead of surfacing in front of a player.
 */
export function compileCheck(code) {
  // eslint-disable-next-line no-new-func
  return new Function(
    'doc',
    'win',
    'root',
    `"use strict";return (async function () {${code}})();`,
  )
}

export function assertCodeCompiles(check, where = 'a check', preamble = '') {
  try {
    compileCheck(`${preamble}${check.code}`)
  } catch (error) {
    throw new Error(`${where}, check "${check.id}" does not compile: ${error.message}`)
  }
  return true
}

export function isCleared(progress, levelId) {
  return Boolean(progress?.[levelId]?.cleared)
}

export function isUnlocked(levels, progress, levelId, { unlockAll = false } = {}) {
  if (unlockAll) return true
  const ordered = sortLevels(levels)
  const index = ordered.findIndex((level) => level.id === levelId)
  if (index <= 0) return index === 0
  return isCleared(progress, ordered[index - 1].id)
}

export function nextLevel(levels, levelId) {
  const ordered = sortLevels(levels)
  const index = ordered.findIndex((level) => level.id === levelId)
  if (index === -1 || index === ordered.length - 1) return null
  return ordered[index + 1]
}

export function totalEarnedXp(progress) {
  return Object.values(progress ?? {}).reduce((sum, entry) => sum + (entry?.xp ?? 0), 0)
}

export function totalPossibleXp(levels) {
  return sortLevels(levels).reduce((sum, level) => sum + level.xp, 0)
}

/** Every xp bonus a level can offer, so the map can show what is still on the table. */
export function maxXpForLevel(level) {
  return Math.round(level.xp * 1.2)
}

export function clearedCount(levels, progress) {
  return levels.filter((level) => isCleared(progress, level.id)).length
}

export function playerRank(totalXp, levels) {
  const possible = totalPossibleXp(levels)
  if (possible === 0) return { index: 0, label: 'New here', progress: 0 }
  const share = totalXp / possible
  const ranks = [
    { at: 0, label: 'New here' },
    { at: 0.2, label: 'Getting the hang of it' },
    { at: 0.45, label: 'Writing real CSS' },
    { at: 0.7, label: 'Knows the box model' },
    { at: 0.95, label: 'Cleared the board' },
  ]
  let index = 0
  ranks.forEach((rank, i) => {
    if (share >= rank.at) index = i
  })
  return { index, label: ranks[index].label, progress: Math.min(1, share) }
}
