export default {
  id: 'center-a-box',
  ordinal: 1,
  title: 'Center a card',
  tier: 1,
  xp: 50,
  brief:
    'One 120 by 120 card, sitting in the middle of the stage both ways. The lesson is flexbox, so the checks expect display: flex on the body.',
  reference: {
    html: '<div class="card"></div>',
    css: `body {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  background: #13233f;
}`,
  },
  starter: `/* The card is already 120 by 120. Move it to the middle. */
.card {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  background: #13233f;
}`,
  checks: [
    {
      id: 'card',
      label: 'A .card element is on the page',
      code: `need('.card')
return true`,
    },
    {
      id: 'size',
      label: 'The card measures 120 by 120',
      code: `var r = box(need('.card'))
if (!near(r.width, 120, 1) || !near(r.height, 120, 1)) {
  return 'The card should measure 120 by 120. It measures ' + num(r.width) + ' by ' + num(r.height) + '.'
}
return true`,
    },
    {
      id: 'flex',
      label: 'The body is a flex container',
      code: `if (css(doc.body).display !== 'flex') {
  return 'Set display: flex on the body. That is the point of this level.'
}
return true`,
    },
    {
      id: 'center-x',
      label: 'The card is centred left to right',
      code: `var r = box(need('.card'))
var s = stage()
var offset = Math.abs((r.left + r.width / 2) - s.w / 2)
if (offset > 2) {
  return 'The card sits ' + num(offset) + 'px off centre across. justify-content is the property that fixes this.'
}
return true`,
    },
    {
      id: 'center-y',
      label: 'The card is centred top to bottom',
      code: `var r = box(need('.card'))
var s = stage()
var offset = Math.abs((r.top + r.height / 2) - s.h / 2)
if (offset > 2) {
  return 'The card sits ' + num(offset) + 'px off centre down the page. align-items is the property that fixes this.'
}
return true`,
    },
  ],
}
