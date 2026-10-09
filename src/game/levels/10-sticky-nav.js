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

const PAGE_STYLES = `.content {
  min-height: 620px;
}
.bar {
  display: flex;
  align-items: center;
  height: 52px;
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 1px solid #dcdcd2;
}
.brand {
  font-family: "Poppins", system-ui, sans-serif;
  font-weight: 700;
  font-size: 15px;
  color: #13233f;
}
.content {
  padding: 16px;
  color: #5a6472;
  font-size: 13px;
  line-height: 1.7;
}`

const PAGE_MARKUP = `<nav class="bar"><span class="brand">PixCodes</span></nav>
<main class="content">
  <p>Scroll this panel.</p>
  <p>The bar should stay at the top.</p>
  <p>Once the page moves, it gets shorter.</p>
  <p>Then a shadow appears under it.</p>
  <p>Keep going.</p>
  <p>That is the whole idea.</p>
</main>`

export default {
  id: 'sticky-nav',
  ordinal: 10,
  title: 'A bar that stays put',
  tier: 3,
  xp: 90,
  mode: 'document',
  brief:
    'A 52px bar pinned to the top while a long page scrolls underneath it, and once the page has moved the bar gets shorter and picks up a shadow. The stage is only 240px tall on purpose, so scroll inside the target to see the effect.',
  reference: {
    html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Sticky bar</title>
<style>
${BASELINE}
.bar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  height: 52px;
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 1px solid #dcdcd2;
  transition: height 160ms ease, box-shadow 160ms ease;
}
.content {
  min-height: 620px;
}
.bar.is-scrolled {
  height: 36px;
  box-shadow: 0 6px 16px rgba(19, 35, 63, 0.14);
}
.brand {
  font-family: "Poppins", system-ui, sans-serif;
  font-weight: 700;
  font-size: 15px;
  color: #13233f;
}
.content {
  padding: 16px;
  color: #5a6472;
  font-size: 13px;
  line-height: 1.7;
}
</style>
</head>
<body>
${PAGE_MARKUP}
<script>
  var bar = document.querySelector('.bar')

  function onScroll() {
    bar.classList.toggle('is-scrolled', window.scrollY > 8)
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
${CLOSE_SCRIPT}
</body>
</html>`,
    css: '',
  },
  starter: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Sticky bar</title>
<style>
${BASELINE}
${PAGE_STYLES}
/* The bar is drawn but nothing pins it, and nothing reacts to scrolling. */
</style>
</head>
<body>
${PAGE_MARKUP}

<!-- Pin the bar, then make it react once the page has moved. The checks also
     want the bar to return to normal when you scroll back to the top. -->
</body>
</html>`,
  checks: [
    {
      id: 'bar',
      label: 'The bar is 52px tall at rest',
      code: `var r = box(need('.bar'))
if (!near(r.height, 52, 1)) {
  return 'The bar should start at 52px tall. It measures ' + num(r.height) + 'px.'
}
return true`,
    },
    {
      id: 'sticky',
      label: 'The bar is pinned to the top',
      code: `var position = css(need('.bar')).position
if (position !== 'sticky' && position !== 'fixed') {
  return 'The bar reports position: ' + position + '. Nothing pins it, so it scrolls away with the page.'
}
if (position === 'sticky' && num(css(need('.bar')).top) !== 0) {
  return 'A sticky bar needs top: 0 to know where to stop.'
}
return true`,
    },
    {
      id: 'scrollable',
      label: 'The page is long enough to scroll past the bar',
      code: `var scroller = doc.scrollingElement
var needed = stage().h + 220
if (scroller.scrollHeight < needed) {
  return 'The page is ' + scroller.scrollHeight + 'px tall in a ' + stage().h + 'px stage, so it can only scroll ' + Math.max(0, scroller.scrollHeight - stage().h) + 'px. The checks scroll it 220px, so give the content a min-height of ' + needed + 'px or more.'
}
return true`,
    },
    {
      id: 'transition',
      label: 'The condensing is animated, not instant',
      code: `var properties = css(need('.bar')).transitionProperty
if (!/height/.test(properties)) {
  return 'The transition covers "' + properties + '". Add height so the bar settles rather than jumping.'
}
return true`,
    },
    {
      id: 'stays',
      label: 'The bar is still at the top after scrolling',
      code: `doc.scrollingElement.scrollTop = 220
await pause(80)
await nextFrame()
var top = box(need('.bar')).top
if (!near(top, 0, 1)) {
  return 'After scrolling 220px the bar sits at ' + num(top) + 'px from the top. It should stay at 0.'
}
return true`,
    },
    {
      id: 'condenses',
      label: 'The bar reacts once the page has moved',
      code: `doc.scrollingElement.scrollTop = 220
/* Long enough for a 160ms transition on the height to finish. */
await pause(400)
await nextFrame()
var scrolled = css(need('.bar'))
var shadow = scrolled.boxShadow && scrolled.boxShadow !== 'none'
var shorter = num(scrolled.height) < 50
if (!shadow && !shorter) {
  return 'After scrolling, the bar is unchanged: ' + num(scrolled.height) + 'px tall with a shadow of "' + scrolled.boxShadow + '". React to scroll so it separates from the page.'
}
return true`,
    },
    {
      id: 'returns',
      label: 'The bar returns to normal at the top',
      code: `doc.scrollingElement.scrollTop = 0
await pause(400)
await nextFrame()
var bar = css(need('.bar'))
if (Math.abs(num(bar.height) - 52) > 2) {
  return 'Back at the top the bar is still condensed at ' + num(bar.height) + 'px. The state should come off, not just go on.'
}
return true`,
    },
  ],
}
