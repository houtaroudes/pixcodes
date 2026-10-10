export default {
  id: 'container-card',
  ordinal: 11,
  title: 'A card that reads its own width',
  tier: 3,
  xp: 95,
  brief:
    'The card sits inside a 300px panel and has to look right at any panel width: label above value when the panel is narrow, label and value on one row when it is wide. The stage itself never changes size, so a media query cannot tell the two cases apart. Ask the panel about its own width instead, and remember that a tie between two rules of equal specificity goes to the one written last.',
  reference: {
    html: `<div class="panel">
  <div class="card">
    <span class="label">Plan</span>
    <span class="value">Team</span>
  </div>
</div>`,
    css: `body {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f4ed;
}

/* The panel is what gets asked, so it has to be a container first. */
.panel {
  container-type: inline-size;
  width: 300px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid #dcdcd2;
  border-radius: 12px;
  font-family: "Poppins", system-ui, sans-serif;
}

.label {
  font-size: 12px;
  color: #5a6472;
}

.value {
  font-size: 15px;
  font-weight: 700;
  color: #13233f;
}

/* Written after the rule above on purpose: same specificity, so the later rule
   is the one that takes the tie when the panel is wide enough. */
@container (min-width: 220px) {
  .card {
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
  }
}`,
  },
  starter: `/* Nothing here reacts to the panel's own width yet. */
body {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f4ed;
}

.panel {
  width: 300px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid #dcdcd2;
  border-radius: 12px;
  font-family: "Poppins", system-ui, sans-serif;
}

.label {
  font-size: 12px;
  color: #5a6472;
}

.value {
  font-size: 15px;
  font-weight: 700;
  color: #13233f;
}`,
  checks: [
    {
      id: 'container',
      label: 'The panel is a query container',
      code: `var type = css(need('.panel')).containerType
if (!/inline-size|^size$/.test(type)) {
  return 'The panel reports container-type: "' + type + '". Until it is a container nothing can ask it about its size. inline-size is enough here.'
}
return true`,
    },
    {
      id: 'rule',
      label: 'A @container rule does the asking',
      code: `var containers = 0
walkRules(function (rule) {
  if (rule.constructor && rule.constructor.name === 'CSSContainerRule') containers++
})
if (containers > 0) return true
var media = mediaRules(/width/)
if (media.length > 0) {
  return 'The only width query on the page is a media query, and a media query measures the whole stage. This level needs @container, which measures the panel.'
}
return 'There is no @container rule yet. That is the one thing that can look at the panel rather than at the window.'`,
    },
    {
      id: 'narrow',
      label: 'A narrow panel stacks the two lines',
      code: `var panel = need('.panel')
var card = need('.card')
panel.style.width = '160px'
await pause(80)
await nextFrame()
var direction = css(card).flexDirection
if (direction !== 'column') {
  return 'At a 160px panel the card reports flex-direction: ' + direction + '. A panel this narrow has to stack the label above the value.'
}
return true`,
    },
    {
      id: 'wide',
      label: 'A wide panel puts them on one row',
      code: `var panel = need('.panel')
var card = need('.card')
panel.style.width = '340px'
await pause(80)
await nextFrame()
var direction = css(card).flexDirection
if (direction !== 'row') {
  return 'At a 340px panel the card still reports flex-direction: ' + direction + '. The wide case never arrives, so the container query is either missing or written before the rule it has to beat.'
}
return true`,
    },
    {
      id: 'spread',
      label: 'The value is pushed to the far end',
      code: `var panel = need('.panel')
var card = need('.card')
panel.style.width = '340px'
await pause(80)
await nextFrame()
var label = box(need('.label'))
var value = box(need('.value'))
var contentRight = num(box(card).right) - num(css(card).paddingRight)
var between = num(value.left - label.right)
if (between < 40) {
  return 'On the row the label and the value sit ' + between + 'px apart. Push them apart so the row reads as a name and its value, not as two words in a sentence.'
}
if (!near(num(value.right), contentRight, 3)) {
  return 'The value ends ' + num(contentRight - num(value.right)) + 'px short of the card content edge, so the two ends are not pinned. One declaration does both ends at once.'
}
return true`,
    },
  ],
}
