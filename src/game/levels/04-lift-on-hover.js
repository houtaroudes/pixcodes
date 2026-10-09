export default {
  id: 'lift-on-hover',
  ordinal: 4,
  title: 'A card that lifts',
  tier: 2,
  xp: 70,
  brief:
    'A 180 by 110 card that rises 6px and deepens its shadow when pointed at, and does exactly the same when reached with the Tab key. The card is focusable, so keyboard users get the same signal as mouse users.',
  reference: {
    html: '<div class="card" tabindex="0">Hover me, or Tab to me</div>',
    css: `body {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  width: 180px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  border: 1px solid #dcdcd2;
  background: #ffffff;
  font-size: 13px;
  color: #5a6472;
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(19, 35, 63, 0.08);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.card:hover,
.card:focus-visible {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(19, 35, 63, 0.18);
}`,
  },
  starter: `/* The shadow below is the resting state. Make the card respond to a pointer
   and to the keyboard, and let it return gently. */
body {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  width: 180px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  border: 1px solid #dcdcd2;
  background: #ffffff;
  font-size: 13px;
  color: #5a6472;
  box-shadow: 0 2px 6px rgba(19, 35, 63, 0.08);
}`,
  checks: [
    {
      id: 'card',
      label: 'The card is 180 by 110',
      code: `var r = box(need('.card'))
if (!near(r.width, 180, 1) || !near(r.height, 110, 1)) {
  return 'The card should measure 180 by 110. It measures ' + num(r.width) + ' by ' + num(r.height) + '.'
}
return true`,
    },
    {
      id: 'resting-shadow',
      label: 'The card has a resting shadow',
      code: `var shadow = css(need('.card')).boxShadow
if (!shadow || shadow === 'none') {
  return 'The card has no shadow at rest, so there is nothing for it to deepen.'
}
return true`,
    },
    {
      id: 'transition',
      label: 'The lift is animated, not instant',
      code: `var properties = css(need('.card')).transitionProperty
if (!/transform/.test(properties)) {
  return 'The transition covers "' + properties + '". Add transform so the card moves smoothly instead of jumping.'
}
return true`,
    },
    {
      id: 'hover-rule',
      label: 'A :hover rule lifts the card',
      code: `var rule = declares(/:hover/, 'transform')
if (!rule) {
  return 'No :hover rule sets a transform. That is the lift.'
}
if (!/translate/i.test(rule.style.transform)) {
  return 'The :hover transform is "' + rule.style.transform + '". A translate moves the card without disturbing the layout.'
}
return true`,
    },
    {
      id: 'lifts-up',
      label: 'The hover lift goes up, not down',
      code: `var rule = declares(/:hover/, 'transform')
var match = rule ? rule.style.transform.match(/-?[\\d.]+px/) : null
if (!match) {
  return 'The :hover transform needs a pixel value, for example translateY(-6px).'
}
if (num(match[0]) >= 0) {
  return 'The card moves down by ' + num(match[0]) + 'px. A lift goes up, so the value is negative.'
}
return true`,
    },
    {
      id: 'focus-parity',
      label: 'The keyboard gets the same lift',
      code: `var rule = declares(/:focus-visible/, 'transform')
if (!rule) {
  return 'There is no :focus-visible rule, so a keyboard user sees nothing when they Tab to the card.'
}
return true`,
    },
    {
      id: 'focusable',
      label: 'The card can actually receive focus',
      code: `var card = need('.card')
var focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY']
if (focusableTags.indexOf(card.tagName) === -1 && card.tabIndex < 0) {
  return 'A ' + card.tagName.toLowerCase() + ' with no tabindex cannot be focused, so :focus-visible never fires. Add tabindex="0" or use a <button>.'
}
return true`,
    },
  ],
}
