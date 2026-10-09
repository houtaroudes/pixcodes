export default {
  id: 'code-row',
  ordinal: 7,
  title: 'Six cells for a code',
  tier: 2,
  xp: 70,
  brief:
    'Six 44 by 44 cells in one row, 8px apart, centred on the stage. Each cell takes a single digit and asks a phone for the number pad. Get the size, the spacing and the one character limit right.',
  reference: {
    html: `<div class="row">
  <input class="cell" inputmode="numeric" maxlength="1" aria-label="Digit 1" />
  <input class="cell" inputmode="numeric" maxlength="1" aria-label="Digit 2" />
  <input class="cell" inputmode="numeric" maxlength="1" aria-label="Digit 3" />
  <input class="cell" inputmode="numeric" maxlength="1" aria-label="Digit 4" />
  <input class="cell" inputmode="numeric" maxlength="1" aria-label="Digit 5" />
  <input class="cell" inputmode="numeric" maxlength="1" aria-label="Digit 6" />
</div>`,
    css: `body {
  display: flex;
  align-items: center;
  justify-content: center;
}

.row {
  display: flex;
  gap: 8px;
}

.cell {
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid #dcdcd2;
  border-radius: 10px;
  background: #ffffff;
  font-family: "JetBrains Mono", monospace;
  font-size: 20px;
  font-weight: 500;
  text-align: center;
  color: #13233f;
}

.cell:focus-visible {
  border-color: #f26b1d;
  outline: 2px solid #f26b1d;
  outline-offset: 2px;
}`,
  },
  starter: `/* Six cells, and only the row is laid out so far. */
body {
  display: flex;
  align-items: center;
  justify-content: center;
}

.row {
  display: flex;
}

.cell {
  border: 1px solid #dcdcd2;
  border-radius: 10px;
  background: #ffffff;
  font-family: "JetBrains Mono", monospace;
  font-size: 20px;
  text-align: center;
  color: #13233f;
}`,
  checks: [
    {
      id: 'count',
      label: 'There are exactly six cells',
      code: `var cells = all('.row .cell')
if (cells.length !== 6) {
  return 'The row needs six cells. It has ' + cells.length + '.'
}
return true`,
    },
    {
      id: 'size',
      label: 'Every cell is 44 by 44',
      code: `var cells = all('.row .cell')
for (var i = 0; i < cells.length; i++) {
  var r = box(cells[i])
  if (!near(r.width, 44, 1) || !near(r.height, 44, 1)) {
    return 'Cell ' + (i + 1) + ' measures ' + num(r.width) + ' by ' + num(r.height) + ', not 44 by 44.'
  }
}
return true`,
    },
    {
      id: 'gap',
      label: 'Cells sit 8px apart',
      code: `var cells = all('.row .cell')
var gaps = []
for (var i = 1; i < cells.length; i++) {
  gaps.push(num(box(cells[i]).left - box(cells[i - 1]).right))
}
var wrong = gaps.filter(function (gap) { return !near(gap, 8, 1) })
if (wrong.length) {
  return 'The gaps are ' + gaps.join(', ') + '. Every gap should be 8px.'
}
return true`,
    },
    {
      id: 'centred',
      label: 'The row sits in the middle',
      code: `var row = box(need('.row'))
var s = stage()
var offset = Math.abs((row.left + row.width / 2) - s.w / 2)
if (offset > 2) {
  return 'The row is ' + num(offset) + 'px off centre. The body needs display: flex and justify-content: center.'
}
return true`,
    },
    {
      id: 'maxlength',
      label: 'Each cell holds one character',
      code: `var cells = all('.row .cell')
for (var i = 0; i < cells.length; i++) {
  if (cells[i].getAttribute('maxlength') !== '1') {
    return 'Cell ' + (i + 1) + ' has maxlength="' + cells[i].getAttribute('maxlength') + '". Without the limit a whole code lands in one box.'
  }
}
return true`,
    },
    {
      id: 'inputmode',
      label: 'A phone keyboard opens on the number pad',
      code: `var cells = all('.row .cell')
for (var i = 0; i < cells.length; i++) {
  if (cells[i].getAttribute('inputmode') !== 'numeric') {
    return 'Cell ' + (i + 1) + ' has no inputmode. Add inputmode="numeric" so a phone shows digits instead of a full keyboard.'
  }
}
return true`,
    },
    {
      id: 'labelled',
      label: 'Each cell is announced separately',
      code: `var cells = all('.row .cell')
var allLabelled = cells.every(function (cell) {
  return Boolean(cell.getAttribute('aria-label') || cell.getAttribute('aria-labelledby'))
})
if (!allLabelled) {
  return 'Six identical single character boxes read as six unlabelled fields. Give each one an aria-label.'
}
return true`,
    },
    {
      id: 'focus-ring',
      label: 'The focused cell is obvious',
      code: `var rule = declares(/:focus/, 'outline') || declares(/:focus/, 'border-color') || declares(/:focus/, 'box-shadow')
if (!rule) {
  return 'There is no :focus rule, so keyboard users cannot tell which cell they are in.'
}
return true`,
    },
  ],
}
