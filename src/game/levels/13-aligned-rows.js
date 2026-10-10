export default {
  id: 'aligned-rows',
  ordinal: 13,
  title: 'Rows that line up across cards',
  tier: 3,
  xp: 95,
  brief:
    'Two cards side by side, each with a title, a description and a footer. The descriptions are different lengths, so the descriptions do not start at the same height and the footers wander. Make the cards borrow the board rows instead of inventing their own, so the three bands line up straight across both cards. The board is the one that decides how tall each band is.',
  reference: {
    html: `<div class="board">
  <article class="card">
    <h3 class="title">Short</h3>
    <p class="body">One line.</p>
    <span class="foot">3 lessons</span>
  </article>
  <article class="card">
    <h3 class="title">A title long enough to wrap</h3>
    <p class="body">A much longer description that wraps onto several lines inside the card, which is exactly what pushes everything below it out of line.</p>
    <span class="foot">9 lessons</span>
  </article>
</div>`,
    css: `body {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f4ed;
}

/* Three named bands, and the board is the only thing that sizes them. */
.board {
  display: grid;
  width: 100%;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr auto;
  column-gap: 12px;
  row-gap: 4px;
}

.card {
  grid-row: 1 / 4;
  display: grid;
  /* Borrowed rows, not invented ones. This is the whole lesson. */
  grid-template-rows: subgrid;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid #dcdcd2;
  border-radius: 12px;
  font-family: "Poppins", system-ui, sans-serif;
}

.title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #13233f;
}

.body {
  margin: 0;
  align-self: start;
  font-size: 12px;
  line-height: 1.5;
  color: #5a6472;
}

.foot {
  align-self: end;
  font-size: 11px;
  font-weight: 600;
  color: #f26b1d;
}`,
  },
  starter: `/* Each card lays out its own rows, so nothing lines up across them. */
body {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f4ed;
}

.board {
  display: grid;
  width: 100%;
  grid-template-columns: 1fr 1fr;
  column-gap: 12px;
}

.card {
  display: grid;
  grid-template-rows: auto 1fr auto;
  row-gap: 4px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid #dcdcd2;
  border-radius: 12px;
  font-family: "Poppins", system-ui, sans-serif;
}

.title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #13233f;
}

.body {
  margin: 0;
  align-self: start;
  font-size: 12px;
  line-height: 1.5;
  color: #5a6472;
}

.foot {
  align-self: end;
  font-size: 11px;
  font-weight: 600;
  color: #f26b1d;
}`,
  checks: [
    {
      id: 'subgrid',
      label: 'The cards borrow their rows from the board',
      code: `var rows = css(need('.card')).gridTemplateRows
if (!/subgrid/.test(rows)) {
  return 'A card reports grid-template-rows: "' + rows + '". As long as it sizes its own rows, the two cards cannot agree on where each band starts.'
}
return true`,
    },
    {
      id: 'three-rows',
      label: 'The board declares three bands',
      code: `var rows = css(need('.board')).gridTemplateRows.trim()
var tracks = rows.split(/\\s+/).filter(function (part) { return part.length > 0 })
if (tracks.length !== 3) {
  return 'The board resolves ' + tracks.length + ' rows (' + rows + '). A title band, a description band and a footer band makes three.'
}
return true`,
    },
    {
      id: 'spans',
      label: 'Each card covers all three bands',
      code: `var board = box(need('.board'))
var cards = all('.card')
for (var i = 0; i < cards.length; i++) {
  var height = num(box(cards[i]).height)
  if (!near(height, board.height, 4)) {
    return 'Card ' + (i + 1) + ' is ' + height + 'px tall inside a board of ' + num(board.height) + 'px. A card that borrows the board rows covers all of them, so the heights should match.'
  }
}
return true`,
    },
    {
      id: 'bodies-align',
      label: 'Both descriptions start at the same height',
      code: `var bodies = all('.body')
if (bodies.length < 2) {
  return 'This level needs both description elements to compare them.'
}
var gap = Math.abs(num(box(bodies[0]).top) - num(box(bodies[1]).top))
if (gap > 2) {
  return 'The descriptions start ' + num(gap) + 'px apart. The longer title is wrapping and pushing its own description down, which is what borrowed rows exist to stop.'
}
return true`,
    },
    {
      id: 'feet-align',
      label: 'Both footers sit on the same line',
      code: `var feet = all('.foot')
var bodies = all('.body')
var gap = Math.abs(num(box(feet[0]).top) - num(box(feet[1]).top))
if (gap > 2) {
  return 'The footers sit ' + num(gap) + 'px apart, so the two cards still end at different heights.'
}
for (var i = 0; i < feet.length; i++) {
  if (box(feet[i]).top < box(bodies[i]).bottom - 1) {
    return 'A footer has climbed on top of the description above it. Give the rows room before pulling the footer down.'
  }
}
return true`,
    },
  ],
}
