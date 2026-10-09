import { HELLO, READY, RESULT } from './harness.js'

/** How long a run may take before it is called hung, rather than left spinning. */
export const RUN_TIMEOUT_MS = 5000

/** How long to wait for the frame to announce itself before giving up on it. */
export const HANDSHAKE_TIMEOUT_MS = 5000

const PING_INTERVAL_MS = 120

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * The parent half of the sandbox protocol. One of these per iframe.
 *
 * Two things here are load bearing.
 *
 * `event.source` is checked on every message, so an unrelated frame on the page
 * cannot feed this runner a result.
 *
 * And a run is never posted until the frame has actually announced itself.
 * `postMessage` into a frame whose document is still loading goes to the initial
 * blank document, which has no listener, and the message is dropped without
 * complaint. Posting blind therefore cost a whole watchdog timeout and looked
 * exactly like the player's code hanging. Instead the runner pings until the
 * frame answers, and only then sends the run.
 */
export function createSandbox(iframe, { timeoutMs = RUN_TIMEOUT_MS } = {}) {
  let nextRunId = 0
  let pending = null
  let disposed = false
  let announced = false

  const readyWaiters = []

  function ping() {
    if (disposed || !iframe?.contentWindow) return
    try {
      iframe.contentWindow.postMessage({ type: HELLO }, '*')
    } catch {
      /* A frame mid-navigation rejects this, and the next ping covers it. */
    }
  }

  function noteAnnounced() {
    if (announced) return
    announced = true
    readyWaiters.splice(0).forEach((resolve) => resolve(true))
  }

  function onMessage(event) {
    if (disposed || !iframe || event.source !== iframe.contentWindow) return

    const data = event.data
    if (!data || typeof data !== 'object') return

    /* READY is sent only after the frame registered its listener, so receiving
       it is what proves a run can be delivered. */
    if (data.type === READY) {
      noteAnnounced()
      return
    }
    if (data.type !== RESULT) return
    if (!pending || data.runId !== pending.runId) return

    const active = pending
    pending = null
    clearTimeout(active.timer)
    active.resolve({
      outcomes: data.outcomes ?? {},
      notes: Array.isArray(data.notes) ? data.notes : [],
      settleMs: Number.isFinite(data.settleMs) ? data.settleMs : 0,
      error: typeof data.error === 'string' ? data.error : '',
      timedOut: false,
    })
  }

  window.addEventListener('message', onMessage)

  /**
   * Ping until the frame answers, or until the deadline passes. Resolves true
   * only on a real announcement, so a caller can tell "the frame is not there"
   * apart from "the frame is thinking".
   */
  async function waitForHandshake(budgetMs = HANDSHAKE_TIMEOUT_MS) {
    const deadline = Date.now() + budgetMs
    while (!announced && !disposed && Date.now() < deadline) {
      ping()
      await delay(PING_INTERVAL_MS)
    }
    return announced
  }

  return {
    /** Resolves when the frame has answered, so a test can wait on the wire. */
    ready: new Promise((resolve) => {
      if (announced) resolve(true)
      else readyWaiters.push(resolve)
    }),

    /**
     * Render one document and grade it. Always resolves: a timeout, a render
     * failure and a clean run are all the same shape, so a caller never has to
     * catch, and the UI never has to reason about a rejected promise.
     */
    async run({ html, css, checks, wrap = true }) {
      const answering = await waitForHandshake()

      if (!answering || disposed || !iframe?.contentWindow) {
        return {
          outcomes: {},
          notes: [],
          settleMs: 0,
          error: 'The preview frame never answered, so the run was cancelled. Reload the page and try again.',
          timedOut: true,
        }
      }

      if (pending) {
        clearTimeout(pending.timer)
        pending.resolve({
          outcomes: {},
          notes: [],
          settleMs: 0,
          error: 'A newer run replaced this one.',
          timedOut: true,
        })
        pending = null
      }

      const runId = ++nextRunId

      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          if (pending && pending.runId === runId) pending = null
          resolve({
            outcomes: {},
            notes: [],
            settleMs: timeoutMs,
            error: 'Your code did not finish, so the run was stopped.',
            timedOut: true,
          })
        }, timeoutMs)

        pending = { runId, resolve, timer }
        iframe.contentWindow.postMessage(
          { type: 'pixcodes:run', runId, html, css, wrap, checks },
          '*',
        )
      })
    },

    dispose() {
      disposed = true
      readyWaiters.splice(0).forEach((resolve) => resolve(false))
      if (pending) {
        clearTimeout(pending.timer)
        pending = null
      }
      window.removeEventListener('message', onMessage)
    },
  }
}
