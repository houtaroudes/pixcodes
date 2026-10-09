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
function nextFrame() {
  return new Promise(function (resolve) {
    requestAnimationFrame(function () { requestAnimationFrame(resolve) })
  })
}
function pause(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms) })
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
