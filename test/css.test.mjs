import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

/*
 * These are source checks, not rendering checks. The bug they guard against was
 * invisible in a passing build and in every unit test, and it only showed up as
 * a focus ring that silently did nothing.
 */

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

/** Strip comments so a selector quoted inside prose cannot satisfy a check. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** The body of an at-rule block, by brace matching, or null when absent. */
function blockBody(source, headerPattern) {
  const match = headerPattern.exec(source)
  if (!match) return null
  const open = source.indexOf('{', match.index)
  let depth = 0
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth += 1
    else if (source[i] === '}') {
      depth -= 1
      if (depth === 0) return source.slice(open + 1, i)
    }
  }
  return null
}

test('the editor focus ring sits outside every layer', () => {
  const code = stripComments(css)
  const base = blockBody(code, /@layer\s+base\s*\{/)

  assert.ok(base, 'index.css should still have a base layer')
  assert.match(code, /\.cm-editor \.cm-content:focus-visible/)
  assert.match(code, /\.cm-editor \.cm-scroller:focus-visible/)

  // An unlayered declaration beats a layered one whatever its specificity, so a
  // ring written inside `@layer base` is the one CodeMirror's own
  // `.cm-content { outline: none }` outranks. The editor rule has to be out here.
  assert.doesNotMatch(
    base,
    /\.cm-editor \.cm-content:focus-visible/,
    'the editor ring must not live inside a layer',
  )
})

test('the base layer still carries the shared focus ring', () => {
  const code = stripComments(css)
  const base = blockBody(code, /@layer\s+base\s*\{/)
  assert.match(base, /:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--ring\)/)
  assert.match(base, /:focus-visible\s*\{[\s\S]*?outline-offset:\s*2px/)
})

test('no em dash or en dash reached the stylesheet', () => {
  assert.doesNotMatch(css, /[\u2013\u2014]/)
})
