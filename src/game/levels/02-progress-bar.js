export default {
  id: 'progress-bar',
  ordinal: 2,
  title: 'A progress bar',
  tier: 1,
  xp: 60,
  brief:
    'A 240 by 12 track with a fill that covers 60 percent of it, rounded at the ends, and no square corner poking out of the track.',
  reference: {
    html: `<div class="track">
  <div class="fill"></div>
</div>`,
    css: `body {
  display: flex;
  align-items: center;
  justify-content: center;
}

.track {
  width: 240px;
  height: 12px;
  border-radius: 999px;
  background: #dedcd4;
  overflow: hidden;
}

.fill {
  width: 60%;
  height: 100%;
  border-radius: 999px;
  background: #f26b1d;
}`,
  },
  starter: `/* The track is done. Give the fill the share it is missing. */
body {
  display: flex;
  align-items: center;
  justify-content: center;
}

.track {
  width: 240px;
  height: 12px;
  border-radius: 999px;
  background: #dedcd4;
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: 999px;
  background: #f26b1d;
}`,
  checks: [
    {
      id: 'track',
      label: 'The track measures 240 by 12',
      code: `var r = box(need('.track'))
if (!near(r.width, 240, 1) || !near(r.height, 12, 1)) {
  return 'The track should measure 240 by 12. It measures ' + num(r.width) + ' by ' + num(r.height) + '.'
}
return true`,
    },
    {
      id: 'clip',
      label: 'The track clips its contents',
      code: `var overflow = css(need('.track')).overflow
if (overflow !== 'hidden' && overflow !== 'clip') {
  return 'The track reports overflow: ' + overflow + '. Hidden overflow is what keeps the fill inside the rounded ends.'
}
return true`,
    },
    {
      id: 'fill-width',
      label: 'The fill covers 60 percent of the track',
      code: `var r = box(need('.fill'))
if (!near(r.width, 144, 2)) {
  return 'Sixty percent of a 240px track is 144px. The fill is ' + num(r.width) + 'px wide.'
}
return true`,
    },
    {
      id: 'fill-height',
      label: 'The fill is as tall as the track',
      code: `var r = box(need('.fill'))
if (!near(r.height, 12, 1)) {
  return 'The fill should be 12px tall to fill the track. It is ' + num(r.height) + 'px.'
}
return true`,
    },
    {
      id: 'fill-inside',
      label: 'The fill starts at the left edge of the track',
      code: `if (!near(box(need('.fill')).left, box(need('.track')).left, 1)) {
  return 'The fill should begin at the track\\'s left edge, not inside it.'
}
return true`,
    },
    {
      id: 'rounded',
      label: 'Both ends are rounded',
      code: `var radius = num(css(need('.fill')).borderTopLeftRadius)
var trackRadius = num(css(need('.track')).borderTopLeftRadius)
if (radius < 6 || trackRadius < 6) {
  return 'Both the track and the fill need a radius of at least 6px. The fill reports ' + radius + 'px.'
}
return true`,
    },
  ],
}
