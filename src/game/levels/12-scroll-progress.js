export default {
  id: 'scroll-progress',
  ordinal: 12,
  title: 'A bar that fills as the page moves',
  tier: 3,
  xp: 100,
  brief:
    'A reading bar across the top of a scroller: empty at the top, full at the bottom, half full halfway. No JavaScript, and no clock either. A scroll timeline replaces the clock, so the animation is driven by the scroll position itself. Watch out for one trap: a scroll timeline takes over the timing but not the duration, and an animation left at its default duration never gets an active interval to paint into.',
  reference: {
    html: `<div class="scroller">
  <div class="track"><div class="bar"></div></div>
  <div class="page">
    <p>Scroll this panel.</p>
    <p>The bar at the top should fill as you go.</p>
    <p>It is a scroll timeline, not a timer, so nothing is watching your position from a script.</p>
    <p>Empty at the top, full at the bottom.</p>
    <p>Halfway down it stands half full.</p>
    <p>The sticky track keeps the bar in view while the text slides under it.</p>
    <p>Keep going.</p>
    <p>Past the middle the bar has more paint than gap.</p>
    <p>Nearly there.</p>
    <p>A scroll timeline maps the scroll range straight onto the animation progress, end to end.</p>
    <p>That is the whole idea.</p>
    <p>Change the duration later and the mapping still runs from empty to full.</p>
  </div>
</div>`,
    css: `/* The stage itself does not scroll, so give it something that does. */
.scroller {
  height: 200px;
  overflow-y: auto;
}

/* Sticky, or the bar scrolls out of sight with the text it is describing. */
.track {
  position: sticky;
  top: 0;
  z-index: 1;
  height: 6px;
  background: #dcdcd2;
}

.bar {
  height: 6px;
  background: #f26b1d;
  transform: scaleX(0);
  transform-origin: left center;
  animation: fill linear;
  /* A scroll timeline drives the progress, but the duration still decides how
     long the active interval is. Left at the default of 0s there is nowhere for
     the animation to be, and the bar never paints. */
  animation-duration: 1s;
  /* Without this the bar snaps back to its resting style the moment the
     timeline reaches either end. */
  animation-fill-mode: both;
  animation-timeline: scroll(nearest);
}

@keyframes fill {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

.page {
  padding: 10px 14px;
  color: #5a6472;
  font-size: 13px;
  line-height: 1.7;
}

.page p {
  margin: 0 0 12px;
}`,
  },
  starter: `/* The bar is drawn, but nothing ties it to the scroll position. */
.scroller {
  height: 200px;
  overflow-y: auto;
}

.track {
  position: sticky;
  top: 0;
  z-index: 1;
  height: 6px;
  background: #dcdcd2;
}

.bar {
  height: 6px;
  background: #f26b1d;
  transform-origin: left center;
}

.page {
  padding: 10px 14px;
  color: #5a6472;
  font-size: 13px;
  line-height: 1.7;
}

.page p {
  margin: 0 0 12px;
}

/* The markup already gives you a scroller, a track, a bar and enough text to
   scroll. What is missing is the animation and the timeline behind it. */`,
  checks: [
    {
      id: 'timeline',
      label: 'The bar runs on a scroll timeline',
      code: `var timeline = css(need('.bar')).animationTimeline
if (!timeline || timeline === 'auto' || timeline === 'none') {
  return 'The bar reports animation-timeline: "' + timeline + '". On its own the animation runs on the clock, which is not what this level is about.'
}
if (!/scroll/.test(timeline)) {
  return 'The bar reports animation-timeline: "' + timeline + '". A view() timeline tracks an element through the viewport. This one has to follow the scroller, so it wants scroll().'
}
return true`,
    },
    {
      id: 'duration',
      label: 'The animation has an active interval to paint into',
      code: `var seconds = num(css(need('.bar')).animationDuration)
if (seconds === 0) {
  return 'The animation duration is 0s. A scroll timeline replaces the clock, but a zero duration still leaves the animation with no active interval, so the bar never paints. Give it animation-duration: 1s.'
}
return true`,
    },
    {
      id: 'keyframes',
      label: 'The animation has keyframes to run',
      code: `var name = css(need('.bar')).animationName
if (!name || name === 'none') {
  return 'The bar has no animation-name, so there is nothing for the timeline to drive.'
}
if (!keyframes(name)) {
  return 'There is no @keyframes rule named "' + name + '". The timeline has nothing to play.'
}
return true`,
    },
    {
      id: 'scrollable',
      label: 'The scroller has somewhere to scroll',
      code: `var scroller = need('.scroller')
var travel = scroller.scrollHeight - scroller.clientHeight
if (travel < 120) {
  return 'The scroller can only travel ' + travel + 'px, so the bar would jump from empty to full almost at once. The checks scroll it, so the panel needs real content to scroll.'
}
return true`,
    },
    {
      id: 'empty-at-top',
      label: 'The bar is empty at the top',
      code: `var scroller = need('.scroller')
scroller.scrollTop = 0
var width = await eventually(function () { return num(box(need('.bar')).width) }, function (w) { return w <= 2 })
if (width > 2) {
  return 'At the top the bar already measures ' + width + 'px. It should start empty and fill from there.'
}
return true`,
    },
    {
      id: 'full-at-bottom',
      label: 'The bar is full at the bottom',
      code: `var scroller = need('.scroller')
var trackWidth = num(box(need('.track')).width)
scroller.scrollTop = scroller.scrollHeight
var width = await eventually(function () { return num(box(need('.bar')).width) }, function (w) { return w >= trackWidth - 3 })
if (width < trackWidth - 3) {
  return 'At the bottom the bar measures ' + width + 'px against a track of ' + trackWidth + 'px. It should be full by then.'
}
return true`,
    },
    {
      id: 'halfway',
      label: 'Half a scroll stands half full',
      code: `var scroller = need('.scroller')
var trackWidth = num(box(need('.track')).width)
var travel = scroller.scrollHeight - scroller.clientHeight
var expected = num(trackWidth / 2)
scroller.scrollTop = Math.round(travel / 2)
var width = await eventually(function () { return num(box(need('.bar')).width) }, function (w) { return Math.abs(w - expected) <= trackWidth * 0.08 })
if (Math.abs(width - expected) > trackWidth * 0.08) {
  return 'Halfway down the bar measures ' + width + 'px where half the track is ' + expected + 'px. The bar should track the scroll position, not ease toward it on a timer.'
}
return true`,
    },
  ],
}
