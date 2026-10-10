export default {
  id: 'layered-cascade',
  ordinal: 15,
  title: 'An order that beats source order',
  tier: 3,
  xp: 100,
  brief:
    'Three stylesheets worth of opinion about one pill. The base layer draws it in white with a hairline border and a rounded shape, the theme layer repaints it in the orange #f26b1d, and the reset layer clears the background and the border as resets do. The resets block is written last on purpose, and it still has to lose: declare the layer order up front so the theme is the one that wins, and leave the border standing. No !important anywhere.',
  reference: {
    html: `<span class="pill">Layers</span>`,
    css: `body {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f4ed;
}

/* Declared once, up front, which is what makes the winner independent of where
   each block happens to sit in the file. */
@layer reset, base, theme;

@layer base {
  .pill {
    padding: 10px 18px;
    background: #ffffff;
    border: 1px solid #dcdcd2;
    border-radius: 999px;
    color: #13233f;
    font-family: "Poppins", system-ui, sans-serif;
    font-size: 14px;
    font-weight: 600;
  }
}

@layer theme {
  .pill {
    background: #f26b1d;
  }
}

@layer reset {
  .pill {
    background: none;
    border: none;
  }
}`,
  },
  starter: `/* One layer, no order declared, and the reset wins because it is written last. */
body {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f4ed;
}

.pill {
  padding: 10px 18px;
  background: #ffffff;
  border: 1px solid #dcdcd2;
  border-radius: 999px;
  color: #13233f;
  font-family: "Poppins", system-ui, sans-serif;
  font-size: 14px;
  font-weight: 600;
}

.pill {
  background: #f26b1d;
}

.pill {
  background: none;
  border: none;
}

/* Three opinions, one selector. Reaching for !important is not the answer the
   checks want; layers are. */`,
  checks: [
    {
      id: 'layers',
      label: 'The layer order is declared up front',
      code: `var order = null
walkRules(function (rule) {
  if (!rule.constructor || rule.constructor.name !== 'CSSLayerStatementRule') return
  var list = rule.nameList ? Array.prototype.slice.call(rule.nameList) : []
  if (list.indexOf('reset') !== -1) order = list
})
if (!order) {
  return 'No layer order statement was found. One line naming the three layers in order is what settles this, without relying on where the blocks sit.'
}
if (order.join(',') !== 'reset,base,theme') {
  return 'The layers are declared as ' + order.join(', ') + '. This level wants reset first, base second and theme last, so the theme is the one left standing.'
}
return true`,
    },
    {
      id: 'three-blocks',
      label: 'Each layer gets a say about the pill',
      code: `var found = {}
walkRules(function (rule) {
  if (!rule.selectorText || !/\\.pill/.test(rule.selectorText)) return
  var parent = rule.parentRule
  if (!parent || !parent.constructor || parent.constructor.name !== 'CSSLayerBlockRule') return
  var name = parent.name || (parent.nameList ? parent.nameList.join(',') : '')
  if (name === 'reset' || name === 'base' || name === 'theme') found[name] = true
})
var missing = []
var wanted = ['reset', 'base', 'theme']
for (var i = 0; i < wanted.length; i++) {
  if (!found[wanted[i]]) missing.push(wanted[i])
}
if (missing.length > 0) {
  return 'No .pill rule sits inside the ' + missing.join(' or ') + ' layer. Each of the three needs its own opinion to argue with.'
}
return true`,
    },
    {
      id: 'theme-wins',
      label: 'The theme colour wins, though its block is not last',
      code: `var background = css(need('.pill')).backgroundColor
if (background !== 'rgb(242, 107, 29)') {
  return 'The pill paints ' + background + '. With the order declared, the theme layer wins whatever the source order, so the orange should be the paint.'
}
return true`,
    },
    {
      id: 'border-survives',
      label: 'The base border survives the reset',
      code: `var style = css(need('.pill')).borderTopStyle
var width = num(css(need('.pill')).borderTopWidth)
if (style === 'none' || width < 0.5) {
  return 'The pill has no border. The base layer sets one and the reset clears it, and since reset is the lowest layer the base border is the one that should stand.'
}
return true`,
    },
    {
      id: 'no-important',
      label: 'Nothing needed !important',
      code: `var offenders = 0
walkRules(function (rule) {
  if (!rule.selectorText || !rule.cssText) return
  var parent = rule.parentRule
  if (!parent || !parent.constructor || parent.constructor.name !== 'CSSLayerBlockRule') return
  if (/!\\s*important/.test(rule.cssText)) offenders++
})
if (offenders > 0) {
  return 'There are ' + offenders + ' !important declarations inside the layers. Layers exist so that order stops being a fight, which makes !important the wrong answer here.'
}
return true`,
    },
  ],
}
