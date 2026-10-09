/* Split so the closing tag never appears literally inside this module. */
const CLOSE_SCRIPT = '<' + '/script>'

const BASELINE = `*, *::before, *::after { box-sizing: border-box; }
html { height: 100%; }
body {
  min-height: 100%;
  margin: 0;
  font-family: "Inter", system-ui, sans-serif;
  color: #13233f;
  background: #ffffff;
}`

export default {
  id: 'cursor-trail',
  ordinal: 9,
  title: 'A dot that chases the pointer',
  tier: 3,
  xp: 90,
  mode: 'document',
  brief:
    'A dot that follows the pointer and eases into place instead of snapping to it. Move your pointer over the target to feel it. This level hands you the whole document, so the markup and the script are yours to write. The checks fire a real pointer event and then watch where the dot ends up.',
  reference: {
    html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Cursor trail</title>
<style>
${BASELINE}
body {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0f1b31;
}
.caption {
  font-size: 13px;
  color: #96a3b8;
}
.trail {
  position: fixed;
  top: 0;
  left: 0;
  width: 18px;
  height: 18px;
  margin: -9px 0 0 -9px;
  border-radius: 50%;
  background: #f26b1d;
  pointer-events: none;
}
</style>
</head>
<body>
<div class="trail"></div>
<p class="caption">Move your pointer across the stage</p>
<script>
  var dot = document.querySelector('.trail')
  var targetX = 0
  var targetY = 0
  var x = 0
  var y = 0

  document.addEventListener('pointermove', function (event) {
    targetX = event.clientX
    targetY = event.clientY
  })

  function step() {
    x += (targetX - x) * 0.16
    y += (targetY - y) * 0.16
    dot.style.transform = 'translate(' + x + 'px, ' + y + 'px)'
    requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
${CLOSE_SCRIPT}
</body>
</html>`,
    css: '',
  },
  starter: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Cursor trail</title>
<style>
${BASELINE}
body {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0f1b31;
}
.caption {
  font-size: 13px;
  color: #96a3b8;
}
.trail {
  position: fixed;
  top: 0;
  left: 0;
  width: 18px;
  height: 18px;
  margin: -9px 0 0 -9px;
  border-radius: 50%;
  background: #f26b1d;
  pointer-events: none;
}
</style>
</head>
<body>
<div class="trail"></div>
<p class="caption">Move your pointer across the stage</p>

<!-- The dot is drawn and the styles are done. Write the script that moves it.
     A pointermove listener and a requestAnimationFrame loop are all this needs,
     but the dot should ease toward the pointer rather than land on it at once. -->
</body>
</html>`,
  checks: [
    {
      id: 'dot',
      label: 'A .trail dot is on the stage',
      code: `need('.trail')
return true`,
    },
    {
      id: 'out-of-flow',
      label: 'The dot is taken out of the layout',
      code: `var position = css(need('.trail')).position
if (position !== 'fixed' && position !== 'absolute') {
  return 'The dot reports position: ' + position + '. It needs to leave the normal flow, or it will push the caption around as it moves.'
}
return true`,
    },
    {
      id: 'round',
      label: 'The dot is round',
      code: `var radius = num(css(need('.trail')).borderTopLeftRadius)
var r = box(need('.trail'))
if (radius < 8 && radius < r.width / 2) {
  return 'The dot has a radius of ' + radius + 'px on a ' + num(r.width) + 'px box. Make it a circle.'
}
return true`,
    },
    {
      id: 'click-through',
      label: 'The dot does not block the pointer',
      code: `var pointer = css(need('.trail')).pointerEvents
if (pointer !== 'none') {
  return 'The dot reports pointer-events: ' + pointer + ', so it will sit under the cursor and swallow clicks.'
}
return true`,
    },
    {
      id: 'has-script',
      label: 'The page runs a script',
      code: `if (doc.body.querySelectorAll('script').length === 0) {
  return 'This level needs JavaScript. A pointermove listener plus a requestAnimationFrame loop is enough.'
}
return true`,
    },
    {
      id: 'follows',
      label: 'A pointer event moves the dot',
      code: `var dot = need('.trail')
var before = box(dot)
doc.dispatchEvent(new PointerEvent('pointermove', { clientX: 120, clientY: 90, bubbles: true }))
await nextFrame()
await nextFrame()
var after = box(dot)
var moved = Math.abs(after.left - before.left) + Math.abs(after.top - before.top)
if (moved < 4) {
  return 'The dot did not move after a pointer event. Listen for pointermove and write the position in a frame loop.'
}
return true`,
    },
    {
      id: 'chases',
      label: 'It moves toward the pointer, not away from it',
      code: `var dot = need('.trail')
var before = box(dot)
doc.dispatchEvent(new PointerEvent('pointermove', { clientX: 320, clientY: 200, bubbles: true }))
await nextFrame()
await nextFrame()
var after = box(dot)
if (after.left - before.left < 2 || after.top - before.top < 2) {
  return 'The dot was at ' + num(before.left) + ',' + num(before.top) + ' and moved to ' + num(after.left) + ',' + num(after.top) + '. It should travel toward the pointer.'
}
return true`,
    },
    {
      id: 'eases',
      label: 'It catches up gradually rather than snapping',
      code: `var dot = need('.trail')
/* A jump clear across the stage, so there is a real distance to ease over. */
doc.dispatchEvent(new PointerEvent('pointermove', { clientX: 24, clientY: 24, bubbles: true }))
await nextFrame()
var early = box(dot)
await pause(200)
var late = box(dot)
var travelled = Math.abs(late.left - early.left) + Math.abs(late.top - early.top)
if (travelled < 20) {
  return 'A frame after the pointer jumped, the dot had already arrived, so it snaps instead of easing. Move a fraction of the remaining distance each frame.'
}
return true`,
    },
  ],
}
