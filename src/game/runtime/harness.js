/**
 * The sandbox document. It is loaded through `srcdoc` into an iframe that carries
 * `sandbox="allow-scripts"` and, critically, NOT `allow-same-origin`. That gives
 * the frame an opaque origin, so a player's code cannot reach this app's DOM,
 * storage or cookies, and `parent.document` throws instead of returning.
 *
 * Every render happens inside this one document. An earlier version replaced the
 * document with `document.open()` and `document.write()`, which silently killed
 * the frame's own message listener on the first run: the frame answered once and
 * then went deaf. So the document is now stable, and a run replaces only the
 * body's children and one `<style>` element.
 *
 * The frame's own style and script live in `<head>`, which keeps `document.body`
 * purely the player's content. That matters: a level may style `body` directly,
 * and a wrapper element around the markup would quietly change what those rules
 * mean.
 *
 * Message protocol, one shape per direction:
 *   parent -> frame   pixcodes:run     { runId, html, css, wrap, checks }
 *   parent -> frame   pixcodes:hello   {}
 *   frame  -> parent  pixcodes:ready   {}
 *   frame  -> parent  pixcodes:result  { runId, outcomes, notes, settleMs, error }
 *
 * The parent accepts a result only when `event.source` is the frame it created.
 */

export const READY = 'pixcodes:ready'
export const RUN = 'pixcodes:run'
export const RESULT = 'pixcodes:result'
export const HELLO = 'pixcodes:hello'

/**
 * The baseline every level is rendered against, so a measurement means the same
 * thing in the target and in the player's attempt. These two colours are the
 * same values as `--ink` and `--plate` in src/index.css, which cannot import a
 * JavaScript file, so this is the one place the pair is written twice.
 *
 * The player's own styles land in a later `<style>` element, so on a tie the
 * level's rules win and a level can override everything here.
 */
export const STAGE_RESET = `
*, *::before, *::after { box-sizing: border-box; }
html { height: 100%; }
body { min-height: 100%; margin: 0; }
body {
  font-family: "Inter", system-ui, sans-serif;
  color: #13233f;
  background: #ffffff;
}
`

/* Split so the closing tag never appears literally inside this module. */
const CLOSE_SCRIPT = '<' + '/script>'

export const HARNESS_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style data-pixcodes="reset">${STAGE_RESET}</style>
<style data-pixcodes="user"></style>
<script data-pixcodes="harness">
(function () {
  var READY = ${JSON.stringify(READY)}
  var RUN = ${JSON.stringify(RUN)}
  var RESULT = ${JSON.stringify(RESULT)}
  var HELLO = ${JSON.stringify(HELLO)}
  var userStyles = document.querySelector('style[data-pixcodes="user"]')
  var errors = []

  window.addEventListener('error', function (event) {
    errors.push(String((event && event.message) || 'a script error'))
  })

  function clearAttributes(node) {
    var names = []
    for (var i = 0; i < node.attributes.length; i++) names.push(node.attributes[i].name)
    for (var j = 0; j < names.length; j++) node.removeAttribute(names[j])
  }

  function copyAttributes(target, source) {
    clearAttributes(target)
    for (var i = 0; i < source.attributes.length; i++) {
      target.setAttribute(source.attributes[i].name, source.attributes[i].value)
    }
  }

  /*
   * Markup inserted with innerHTML never runs its scripts, so each one is
   * replaced with a fresh element carrying the same attributes and text. That is
   * what lets a level ask for JavaScript at all.
   */
  function reviveScripts(root) {
    var scripts = root.querySelectorAll('script')
    for (var i = 0; i < scripts.length; i++) {
      var old = scripts[i]
      var fresh = document.createElement('script')
      for (var a = 0; a < old.attributes.length; a++) {
        fresh.setAttribute(old.attributes[a].name, old.attributes[a].value)
      }
      fresh.textContent = old.textContent
      old.parentNode.replaceChild(fresh, old)
    }
  }

  function stage() {
    clearAttributes(document.body)
    document.body.innerHTML = ''
    userStyles.textContent = ''
  }

  /* The wrapped shape: the player wrote CSS, and the markup belongs to the level. */
  function renderWrapped(html, css) {
    stage()
    userStyles.textContent = css
    document.body.innerHTML = html
    reviveScripts(document.body)
  }

  /* The unwrapped shape: the player wrote the whole document. */
  function renderDocument(source) {
    stage()

    var parsed = new DOMParser().parseFromString(source, 'text/html')
    var styles = parsed.head ? parsed.head.querySelectorAll('style') : []
    var collected = []
    for (var i = 0; i < styles.length; i++) collected.push(styles[i].textContent)
    userStyles.textContent = collected.join('\\n')

    copyAttributes(document.documentElement, parsed.documentElement)
    copyAttributes(document.body, parsed.body)
    document.body.innerHTML = parsed.body.innerHTML
    reviveScripts(document.body)
  }

  /*
   * How long to wait for a painted frame before going on without one.
   *
   * Two animation frames are the clean way to let a style change land, and
   * document.fonts.ready is the clean way to wait for webfonts, but neither ever
   * fires in a frame that is scrolled out of view or sitting in a background
   * tab, because such a frame is not painted. A run that waited on them would
   * stall until the parent's watchdog called it hung, and the player would be
   * told their own code failed to finish when it never ran at all. Every wait
   * below therefore has a timer standing behind it.
   */
  var SETTLE_FALLBACK_MS = 300

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms)
    })
  }

  function nextPaint() {
    return new Promise(function (resolve) {
      var done = false
      function finish() {
        if (done) return
        done = true
        resolve()
      }
      var timer = setTimeout(finish, SETTLE_FALLBACK_MS)
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          clearTimeout(timer)
          finish()
        })
      })
    })
  }

  /* Fonts first, so a check never measures text in a fallback face, then one
     painted frame, so the last style change has landed. */
  function settle() {
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : null
    var loaded = fonts ? Promise.race([fonts, delay(SETTLE_FALLBACK_MS)]) : Promise.resolve()
    return Promise.resolve(loaded).then(nextPaint)
  }

  /*
   * Checks run in order, one at a time, and a check may return a promise when it
   * needs to watch the page react. Sequential on purpose: an async check that
   * mutates the page would otherwise change what the next check measures.
   */
  async function runChecks(checks) {
    var outcomes = {}
    for (var i = 0; i < checks.length; i++) {
      var check = checks[i]
      try {
        var fn = new Function(
          'doc',
          'win',
          'root',
          '"use strict";return (async function () {' + check.code + '})();'
        )
        outcomes[check.id] = await fn(document, window, document.body)
      } catch (error) {
        outcomes[check.id] = String((error && error.message) || error)
      }
    }
    return outcomes
  }

  window.addEventListener('message', async function (event) {
    var data = event.data
    if (!data) return

    /*
     * The parent replies to the first READY, but if it attached its listener
     * after that fired this answers a ping instead, so a run never waits out the
     * full ready timeout.
     */
    if (data.type === HELLO) {
      parent.postMessage({ type: READY }, '*')
      return
    }

    if (data.type !== RUN) return

    errors = []
    var startedAt = performance.now()

    try {
      if (data.wrap === false) renderDocument(String(data.html || ''))
      else renderWrapped(String(data.html || ''), String(data.css || ''))
    } catch (error) {
      parent.postMessage({
        type: RESULT,
        runId: data.runId,
        error: 'Your code could not be rendered: ' + String((error && error.message) || error),
      }, '*')
      return
    }

    /*
     * Every path out of a run posts exactly one RESULT, including the ones where
     * the frame is not painted. The parent's watchdog is a backstop for a frame
     * that has genuinely gone away, not the routine end of a run.
     */
    ;(async function () {
      await settle()
      var outcomes = await runChecks(data.checks || [])
      parent.postMessage({
        type: RESULT,
        runId: data.runId,
        outcomes: outcomes,
        notes: errors.slice(0, 3),
        settleMs: Math.round(performance.now() - startedAt),
      }, '*')
    })().catch(function (error) {
      parent.postMessage({
        type: RESULT,
        runId: data.runId,
        error: 'The checks could not run: ' + String((error && error.message) || error),
      }, '*')
    })
  })

  parent.postMessage({ type: READY }, '*')
})()
${CLOSE_SCRIPT}
</head>
<body></body>
</html>`
