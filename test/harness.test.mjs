import assert from 'node:assert/strict'
import { test } from 'node:test'
import { HARNESS_HTML, STAGE_RESET } from '../src/game/runtime/harness.js'

const script = HARNESS_HTML.split('<script data-pixcodes="harness">')[1].split('<' + '/script>')[0]

test('the harness script compiles', () => {
  assert.ok(script.length > 200)
  assert.doesNotThrow(() => new Function(script))
})

test('the harness never replaces the document', () => {
  // document.open() tears down the frame's own message listener, which made the
  // frame answer exactly one run and then go silent.
  assert.doesNotMatch(HARNESS_HTML, /document\s*\.\s*open/)
  assert.doesNotMatch(HARNESS_HTML, /document\s*\.\s*write/)
})

test('both render shapes are present', () => {
  assert.match(script, /renderWrapped/)
  assert.match(script, /renderDocument/)
  assert.match(script, /DOMParser/)
})

test('the frame answers the handshake and runs checks', () => {
  assert.match(script, /pixcodes:ready/)
  assert.match(script, /pixcodes:hello/)
  assert.match(script, /new Function/)
  assert.match(script, /postMessage/)
})

test('the harness keeps its own style and script out of the body', () => {
  const body = HARNESS_HTML.split('<body>')[1]
  assert.match(body, /^\s*<\/body>/)
  assert.match(HARNESS_HTML, /<style data-pixcodes="user">/)
  assert.match(HARNESS_HTML, /<style data-pixcodes="reset">/)
})

test('a run never depends on the frame being painted', () => {
  // An iframe scrolled out of view, or in a background tab, is not painted, so
  // its animation frames never fire. Waiting on them alone stalled every run
  // until the parent called it hung, and the player was told their own code did
  // not finish. Each wait therefore has a timer behind it.
  assert.match(script, /SETTLE_FALLBACK_MS/)
  assert.match(script, /setTimeout\(finish, SETTLE_FALLBACK_MS\)/)
  assert.match(script, /Promise\.race\(\[fonts, delay\(SETTLE_FALLBACK_MS\)\]\)/)
})

test('every run answers, including a run that goes wrong', () => {
  assert.match(script, /await settle\(\)/)
  assert.match(script, /catch\(function \(error\) \{/)
  const answers = script.match(/parent\.postMessage\(/g) ?? []
  assert.ok(answers.length >= 3, 'the frame should answer the handshake and every run')
})

test('the stage baseline sets a light ground and no dashes', () => {
  assert.match(STAGE_RESET, /box-sizing: border-box/)
  assert.doesNotMatch(STAGE_RESET, /[\u2013\u2014]/)
})
