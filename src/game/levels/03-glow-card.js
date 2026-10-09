export default {
  id: 'glow-card',
  ordinal: 3,
  title: 'Give it a glow',
  tier: 1,
  xp: 60,
  brief:
    'A 200 by 120 white card on the dark stage, with a soft orange light coming off it. A glow has no offset: the light sits behind the card, not beside it.',
  reference: {
    html: '<div class="card"></div>',
    css: `body {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f1b31;
}

.card {
  width: 200px;
  height: 120px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 0 24px 2px rgba(242, 107, 29, 0.6);
}`,
  },
  starter: `/* The card is finished. Give it a glow that comes from behind it. */
body {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f1b31;
}

.card {
  width: 200px;
  height: 120px;
  border-radius: 16px;
  background: #ffffff;
}`,
  checks: [
    {
      id: 'stage-dark',
      label: 'The stage is dark enough to see a glow',
      code: `var background = css(doc.body).backgroundColor
if (background === 'rgba(0, 0, 0, 0)' || background === 'rgb(255, 255, 255)') {
  return 'The stage is still plain light. A glow needs a dark ground behind it.'
}
return true`,
    },
    {
      id: 'has-shadow',
      label: 'The card casts a shadow',
      code: `var shadow = css(need('.card')).boxShadow
if (!shadow || shadow === 'none') {
  return 'The card has no box-shadow yet.'
}
return true`,
    },
    {
      id: 'no-offset',
      label: 'The glow has no offset in either direction',
      code: `var lengths = css(need('.card')).boxShadow.match(/-?[\\d.]+px/g) || []
if (lengths.length < 3) {
  return 'That box-shadow is missing its offset or blur values.'
}
if (!near(num(lengths[0]), 0, 0.5) || !near(num(lengths[1]), 0, 0.5)) {
  return 'An offset of ' + num(lengths[0]) + 'px and ' + num(lengths[1]) + 'px pushes the light to one side. A glow keeps both at 0.'
}
return true`,
    },
    {
      id: 'blur',
      label: 'The glow is soft, at least 16px of blur',
      code: `var lengths = css(need('.card')).boxShadow.match(/-?[\\d.]+px/g) || []
var blur = num(lengths[2])
if (blur < 16) {
  return 'The blur is ' + blur + 'px. A soft glow needs at least 16px, otherwise it reads as a hard edge.'
}
return true`,
    },
    {
      id: 'colour',
      label: 'The glow is the orange, not a grey',
      code: `var shadow = css(need('.card')).boxShadow
if (!/rgba?\\(\\s*2[0-9]{2}/.test(shadow)) {
  return 'The glow reads as ' + shadow + '. Use the orange rgba(242, 107, 29, 0.6) so the light has a colour.'
}
return true`,
    },
    {
      id: 'radius',
      label: 'The card has rounded corners',
      code: `var radius = num(css(need('.card')).borderTopLeftRadius)
if (radius < 8) {
  return 'A 120px tall card needs a radius of at least 8px to look deliberate. It has ' + radius + 'px.'
}
return true`,
    },
  ],
}
