/**
 * Prepended to every check's `code` before it is sent to the sandbox, so a level
 * can read like a sentence instead of a paragraph of geometry.
 *
 * This is a string rather than a module because the sandbox frame is a separate
 * document built from `srcdoc`, so nothing here can be imported at run time.
 *
 * A check's code is compiled as the body of an async function, so a check may
 * `await nextFrame()` when it needs to watch the page react.
 */
export const CHECK_HELPERS = `
function el(sel) { return doc.querySelector(sel) }
function all(sel) { return Array.prototype.slice.call(doc.querySelectorAll(sel)) }
function need(sel) {
  var node = doc.querySelector(sel)
  if (!node) throw new Error('Nothing on the page matches ' + sel + ', and this level needs it.')
  return node
}
function css(node) { return win.getComputedStyle(node) }
function box(node) { return node.getBoundingClientRect() }
function num(value) {
  var n = parseFloat(value)
  return isNaN(n) ? 0 : Math.round(n * 100) / 100
}
function near(a, b, tolerance) { return Math.abs(a - b) <= (tolerance === undefined ? 2 : tolerance) }
function stage() { return { w: win.innerWidth, h: win.innerHeight } }
function walkRules(visit) {
  function descend(list) {
    for (var i = 0; i < list.length; i++) {
      visit(list[i])
      if (list[i].cssRules) descend(list[i].cssRules)
    }
  }
  var sheets = doc.styleSheets
  for (var s = 0; s < sheets.length; s++) {
    try { descend(sheets[s].cssRules) } catch (e) { /* a sheet we cannot read is not ours */ }
  }
}
function rules(pattern) {
  var out = []
  walkRules(function (rule) {
    if (rule.selectorText && pattern.test(rule.selectorText)) out.push(rule)
  })
  return out
}
function declares(pattern, prop) {
  var found = rules(pattern)
  for (var i = 0; i < found.length; i++) {
    if (found[i].style && found[i].style.getPropertyValue(prop)) return found[i]
  }
  return null
}
function keyframes(name) {
  var hit = null
  walkRules(function (rule) {
    if (rule.type === 7 && rule.name === name) hit = rule
  })
  return hit
}
function mediaRules(pattern) {
  var out = []
  walkRules(function (rule) {
    if (rule.type === 4 && rule.media && pattern.test(rule.media.mediaText)) out.push(rule)
  })
  return out
}
/*
   * Two animation frames are the clean way to let a change land, but a frame that
   * is scrolled out of view is not painted, and an unpainted frame never fires an
   * animation frame. A check that waited on those alone would hang until the run
   * was called hung, which reads to the player as their own code failing. A timer
   * therefore stands behind the wait, exactly as it does in the harness itself.
   */
function nextFrame() {
  return new Promise(function (resolve) {
    var done = false
    function finish() {
      if (done) return
      done = true
      resolve()
    }
    var timer = setTimeout(finish, 300)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        clearTimeout(timer)
        finish()
      })
    })
  })
}
function pause(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms) })
}
/*
 * Retry a measurement until it satisfies the ok test, or until a short budget
 * runs out, and hand back the last reading either way. A scroll-driven animation lands on
 * the compositor, so a painted value can trail a programmatic scroll by more than
 * a frame or two; a fixed pause would read the old value and report a failure
 * for code that is right. The budget stays small on purpose: the whole run has
 * only a few seconds before the parent calls it hung, so a level waits for a
 * value to arrive rather than for a page to become perfect.
 */
function eventually(read, ok, tries) {
  var budget = tries === undefined ? 5 : tries
  var value = read()
  var spent = 0
  function step() {
    if (ok(value) || spent >= budget) return Promise.resolve(value)
    spent++
    return pause(50).then(nextFrame).then(function () {
      value = read()
      return step()
    })
  }
  return step()
}
`.trim()

/** The default stage the target and the player's attempt are both rendered into. */
export const STAGE_WIDTH = 360
export const STAGE_HEIGHT = 240

/**
 * Turn a level's checks into the payload the sandbox can run. Only the id and
 * the code cross the boundary: a label is UI copy and has no business inside the
 * frame, and grading re-joins the two by id.
 */
export function toFrameChecks(checks) {
  return checks.map((check) => ({ id: check.id, code: `${CHECK_HELPERS}\n${check.code}` }))
}
