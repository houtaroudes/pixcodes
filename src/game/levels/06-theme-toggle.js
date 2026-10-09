export default {
  id: 'theme-toggle',
  ordinal: 6,
  title: 'A switch with no JavaScript',
  tier: 2,
  xp: 80,
  brief:
    'A switch that repaints the whole stage when it is flipped, using nothing but a checkbox. Click it in the target to see what you are aiming for. :has() is what lets the page react to a checkbox down the tree.',
  reference: {
    html: `<input class="switch" type="checkbox" id="theme" />
<label class="track" for="theme"><span class="knob"></span></label>
<p class="copy">Flip the switch</p>`,
    css: `body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #f4f4ed;
  color: #13233f;
  transition: background-color 200ms ease, color 200ms ease;
}

.switch {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.track {
  position: relative;
  display: block;
  width: 64px;
  height: 34px;
  border-radius: 999px;
  background: #dcdcd2;
  cursor: pointer;
  transition: background-color 180ms ease;
}

.knob {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #ffffff;
  transition: left 180ms ease;
}

.switch:checked + .track {
  background: #f26b1d;
}

.switch:checked + .track .knob {
  left: 34px;
}

body:has(.switch:checked) {
  background-color: #13233f;
  color: #f4f4ed;
}`,
  },
  starter: `/* The switch is drawn but it does not do anything yet. */
body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #f4f4ed;
  color: #13233f;
}

.switch {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.track {
  position: relative;
  display: block;
  width: 64px;
  height: 34px;
  border-radius: 999px;
  background: #dcdcd2;
  cursor: pointer;
}

.knob {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #ffffff;
}`,
  checks: [
    {
      id: 'no-script',
      label: 'The page uses no JavaScript',
      code: `if (doc.body.querySelectorAll('script').length > 0) {
  return 'This level is CSS only. Remove the script tag.'
}
return true`,
    },
    {
      id: 'checkbox',
      label: 'A checkbox drives the switch',
      code: `var toggle = need('input[type="checkbox"]')
if (!toggle.id) {
  return 'The checkbox needs an id so the label can point at it.'
}
return true`,
    },
    {
      id: 'hidden',
      label: 'The checkbox itself is out of sight',
      code: `var toggle = need('input[type="checkbox"]')
var hidden = css(toggle).opacity === '0' || box(toggle).width <= 2 || css(toggle).visibility === 'hidden'
if (!hidden) {
  return 'The raw checkbox is still visible. Push it out of the way so only the switch shows, but keep it focusable.'
}
return true`,
    },
    {
      id: 'label-target',
      label: 'The label is wired to the checkbox',
      code: `var toggle = need('input[type="checkbox"]')
var label = need('label[for]')
if (label.htmlFor !== toggle.id) {
  return 'The label points at "' + label.htmlFor + '" but the checkbox is "' + toggle.id + '".'
}
return true`,
    },
    {
      id: 'checked-rule',
      label: 'A :checked rule changes the track',
      code: `var rule = declares(/:checked/, 'background-color') || declares(/:checked/, 'background')
if (!rule) {
  return 'No :checked rule repaints the track, so the switch never looks different when it is on.'
}
return true`,
    },
    {
      id: 'knob-moves',
      label: 'The knob moves to the other end',
      code: `var rule = declares(/:checked/, 'left') || declares(/:checked/, 'transform')
if (!rule) {
  return 'The knob stays where it is when the switch is on. Move it with left or transform.'
}
return true`,
    },
    {
      id: 'page-repaints',
      label: 'The page itself repaints',
      code: `var rule = declares(/:has\\(/, 'background-color') || declares(/:has\\(/, 'background')
if (!rule) {
  return 'The switch moves but the page does not change. A :has() rule on the body is what repaints it.'
}
return true`,
    },
    {
      id: 'transition',
      label: 'The change is animated, and only where it helps',
      code: `var track = css(need('.track')).transitionProperty
var knob = css(need('.knob')).transitionProperty
if (!/background/.test(track) || !/left|transform/.test(knob)) {
  return 'The track transitions "' + track + '" and the knob "' + knob + '". Both need to animate so the switch does not snap.'
}
return true`,
    },
  ],
}
