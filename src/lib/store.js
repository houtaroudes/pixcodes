/**
 * Progress persistence, on localStorage for now.
 *
 * The storage object is a parameter rather than a global read, so the parsing
 * and merging rules can be tested under plain node, where localStorage does not
 * exist. Every read is defensive: a half-written or hand-edited value falls back
 * to a fresh board instead of throwing the app into a blank screen.
 */
import { mergeProgressEntry } from './judge.js'

export const STORAGE_KEY = 'pixcodes.progress.v1'
export const DRAFTS_KEY = 'pixcodes.drafts.v1'
export const STATE_VERSION = 1

export function emptyState() {
  return { version: STATE_VERSION, progress: {}, unlockAll: false, lastPlayedId: null }
}

function resolveStorage(storage) {
  if (storage) return storage
  try {
    return globalThis.localStorage ?? null
  } catch {
    /* A browser with storage blocked throws on access, and that is fine. */
    return null
  }
}

/**
 * Turn whatever was on disk into a usable state. Anything unrecognised is
 * dropped rather than repaired silently, so a corrupt entry cannot resurrect a
 * score the player never earned.
 */
export function parseState(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return emptyState()

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return emptyState()
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return emptyState()
  if (parsed.version !== STATE_VERSION) return emptyState()

  const progress = {}
  const source = parsed.progress && typeof parsed.progress === 'object' ? parsed.progress : {}
  for (const [levelId, entry] of Object.entries(source)) {
    if (!entry || typeof entry !== 'object') continue
    progress[levelId] = {
      score: clampScore(entry.score),
      xp: Math.max(0, Math.round(Number(entry.xp) || 0)),
      attempts: Math.max(0, Math.round(Number(entry.attempts) || 0)),
      cleared: entry.cleared === true,
      bestDurationMs: Number.isFinite(entry.bestDurationMs) ? entry.bestDurationMs : null,
    }
  }

  return {
    version: STATE_VERSION,
    progress,
    unlockAll: parsed.unlockAll === true,
    lastPlayedId: typeof parsed.lastPlayedId === 'string' ? parsed.lastPlayedId : null,
  }
}

export function readState(storage) {
  const target = resolveStorage(storage)
  if (!target) return emptyState()
  try {
    return parseState(target.getItem(STORAGE_KEY))
  } catch {
    return emptyState()
  }
}

export function writeState(state, storage) {
  const target = resolveStorage(storage)
  if (!target) return state
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* A full or blocked store loses the save, which must not break the run. */
  }
  return state
}

export function clearState(storage) {
  const target = resolveStorage(storage)
  if (!target) return emptyState()
  try {
    target.removeItem(STORAGE_KEY)
  } catch {
    /* Nothing to do: the caller still gets a fresh state back. */
  }
  return emptyState()
}

/** Fold one finished run into the board and return the next state. */
export function recordRun(state, levelId, run) {
  const previous = state.progress[levelId]
  return {
    ...state,
    progress: { ...state.progress, [levelId]: mergeProgressEntry(previous, run) },
    lastPlayedId: levelId,
  }
}

export function setUnlockAll(state, unlockAll) {
  return { ...state, unlockAll: Boolean(unlockAll) }
}

export function rememberLevel(state, levelId) {
  return { ...state, lastPlayedId: levelId }
}

/**
 * Work in progress, kept under its own key so a draft never mixes with scores.
 * A draft is whatever the player last typed in a level, and losing one is the
 * most annoying thing this app could do, so it is saved on every change.
 */
export function readDrafts(storage) {
  const target = resolveStorage(storage)
  if (!target) return {}
  try {
    const parsed = JSON.parse(target.getItem(DRAFTS_KEY) ?? '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const drafts = {}
    for (const [levelId, code] of Object.entries(parsed)) {
      if (typeof code === 'string') drafts[levelId] = code
    }
    return drafts
  } catch {
    return {}
  }
}

export function readDraft(levelId, storage) {
  return readDrafts(storage)[levelId] ?? null
}

export function writeDraft(levelId, code, storage) {
  const target = resolveStorage(storage)
  if (!target) return code
  try {
    const drafts = readDrafts(target)
    drafts[levelId] = code
    target.setItem(DRAFTS_KEY, JSON.stringify(drafts))
  } catch {
    /* Same trade as above: a lost draft must not break the level. */
  }
  return code
}

export function clearDraft(levelId, storage) {
  const target = resolveStorage(storage)
  if (!target) return null
  try {
    const drafts = readDrafts(target)
    delete drafts[levelId]
    target.setItem(DRAFTS_KEY, JSON.stringify(drafts))
  } catch {
    /* Nothing useful to do. */
  }
  return null
}

function clampScore(value) {
  const score = Math.round(Number(value) || 0)
  return Math.min(100, Math.max(0, score))
}
