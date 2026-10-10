export default {
  id: 'named-layout',
  ordinal: 14,
  title: 'A layout drawn as a map',
  tier: 2,
  xp: 90,
  brief:
    'Four panels in one shell: a header across the top, a 120px sidebar under it on the left, the main panel filling what is left, and a footer across the bottom. Draw that arrangement as the layout itself, so the grid reads like the picture before a single child is placed. Each child is then placed by name rather than by counting lines.',
  reference: {
    html: `<div class="head">PixCodes</div>
<div class="side">Side</div>
<div class="main">Main</div>
<div class="foot">Footer</div>`,
    css: `body {
  height: 100%;
  display: grid;
  /* The map comes first, so the picture is the layout. */
  grid-template-areas:
    "head head"
    "side main"
    "foot foot";
  grid-template-columns: 120px 1fr;
  grid-template-rows: auto 1fr auto;
  gap: 8px;
  padding: 12px;
  background: #f4f4ed;
  font-family: "Poppins", system-ui, sans-serif;
  font-size: 12px;
}

.head {
  grid-area: head;
}

.side {
  grid-area: side;
}

.main {
  grid-area: main;
}

.foot {
  grid-area: foot;
}

.head,
.side,
.main,
.foot {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #dcdcd2;
  border-radius: 10px;
  color: #5a6472;
}`,
  },
  starter: `/* Every panel is strung out in one column, one after another. */
body {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f4f4ed;
  font-family: "Poppins", system-ui, sans-serif;
  font-size: 12px;
}

.head,
.side,
.main,
.foot {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #dcdcd2;
  border-radius: 10px;
  color: #5a6472;
}`,
  checks: [
    {
      id: 'areas',
      label: 'The layout is drawn as a map of named areas',
      code: `var areas = css(doc.body).gridTemplateAreas
if (!areas || areas === 'none') {
  return 'The body reports grid-template-areas: "' + areas + '". Naming the regions is what lets each child be placed by name.'
}
var wanted = ['head', 'side', 'main', 'foot']
var missing = []
for (var i = 0; i < wanted.length; i++) {
  if (areas.indexOf(wanted[i]) === -1) missing.push(wanted[i])
}
if (missing.length > 0) {
  return 'The map reads ' + areas + ', with no ' + missing.join(' or ') + ' in it.'
}
return true`,
    },
    {
      id: 'named-children',
      label: 'Each child is placed by its area name',
      code: `var wanted = ['.head', '.side', '.main', '.foot']
for (var i = 0; i < wanted.length; i++) {
  var area = css(need(wanted[i])).gridArea
  if (!area || area === 'auto') {
    return wanted[i] + ' has no grid-area, so it is being placed by position rather than by name.'
  }
}
return true`,
    },
    {
      id: 'head-spans',
      label: 'The header runs the full width of the first row',
      code: `var body = box(doc.body)
var inner = {
  left: num(body.left) + num(css(doc.body).paddingLeft),
  right: num(body.right) - num(css(doc.body).paddingRight),
  top: num(body.top) + num(css(doc.body).paddingTop),
}
var head = box(need('.head'))
if (!near(num(head.left), inner.left, 3) || !near(num(head.right), inner.right, 3)) {
  return 'The header spans ' + num(head.left) + ' to ' + num(head.right) + ', while the grid content spans ' + inner.left + ' to ' + inner.right + '. Give the header both columns.'
}
if (!near(num(head.top), inner.top, 3)) {
  return 'The header starts ' + num(num(head.top) - inner.top) + 'px below the top of the grid. It belongs in the first row.'
}
return true`,
    },
    {
      id: 'side-column',
      label: 'The sidebar holds a 120px column, the main takes the rest',
      code: `var side = box(need('.side'))
var main = box(need('.main'))
var gap = num(css(doc.body).columnGap)
if (!near(num(side.width), 120, 3)) {
  return 'The sidebar is ' + num(side.width) + 'px wide where the grid asks for a 120px column.'
}
if (!near(num(main.left), num(side.right) + gap, 3)) {
  return 'The main panel starts ' + num(num(main.left) - num(side.right)) + 'px after the sidebar, where one gap of ' + gap + 'px belongs.'
}
if (main.width <= side.width) {
  return 'The main panel is ' + num(main.width) + 'px against the sidebar at ' + num(side.width) + 'px. The main panel takes whatever is left.'
}
return true`,
    },
    {
      id: 'middle-band',
      label: 'The sidebar and the main panel share one band',
      code: `var side = box(need('.side'))
var main = box(need('.main'))
if (!near(num(side.top), num(main.top), 3)) {
  return 'The sidebar starts at ' + num(side.top) + ' and the main panel at ' + num(main.top) + '. Both sit in the middle band, so their tops should agree.'
}
if (!near(num(side.bottom), num(main.bottom), 3)) {
  return 'The sidebar ends at ' + num(side.bottom) + ' and the main panel at ' + num(main.bottom) + '. One band means one height.'
}
return true`,
    },
    {
      id: 'foot-bottom',
      label: 'The footer closes the shell across the bottom',
      code: `var body = box(doc.body)
var inner = {
  left: num(body.left) + num(css(doc.body).paddingLeft),
  right: num(body.right) - num(css(doc.body).paddingRight),
  bottom: num(body.bottom) - num(css(doc.body).paddingBottom),
}
var foot = box(need('.foot'))
var side = box(need('.side'))
if (!near(num(foot.left), inner.left, 3) || !near(num(foot.right), inner.right, 3)) {
  return 'The footer runs from ' + num(foot.left) + ' to ' + num(foot.right) + ' rather than the full grid width.'
}
if (!near(num(foot.bottom), inner.bottom, 3)) {
  return 'The footer ends ' + num(inner.bottom - num(foot.bottom)) + 'px short of the bottom of the grid.'
}
if (num(foot.top) < num(side.bottom) - 1) {
  return 'The footer overlaps the band above it. It needs a row of its own.'
}
return true`,
    },
  ],
}
