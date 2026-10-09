export default {
  id: 'animated-gradient',
  ordinal: 8,
  title: 'A background that drifts',
  tier: 2,
  xp: 70,
  brief:
    'Fill the whole stage with a gradient that moves on its own, with no JavaScript. A gradient only has room to move if its background-size is larger than the stage, and the last check wants a guard for people who asked their system for less motion.',
  reference: {
    html: '<div class="caption">PixCodes</div>',
    css: `body {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(120deg, #13233f, #f26b1d, #13233f);
  background-size: 220% 220%;
  animation: drift 7s ease-in-out infinite;
}

.caption {
  font-family: "Poppins", system-ui, sans-serif;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #f4f4ed;
}

@keyframes drift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  body {
    animation: none;
  }
}`,
  },
  starter: `/* The gradient is painted but it never moves. */
body {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(120deg, #13233f, #f26b1d, #13233f);
}

.caption {
  font-family: "Poppins", system-ui, sans-serif;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #f4f4ed;
}`,
  checks: [
    {
      id: 'gradient',
      label: 'The background is a gradient',
      code: `var image = css(doc.body).backgroundImage
if (!/gradient/.test(image)) {
  return 'The background image reads "' + image + '". This level wants a gradient, not a flat colour.'
}
return true`,
    },
    {
      id: 'oversized',
      label: 'The gradient is bigger than the stage',
      code: `var size = css(doc.body).backgroundSize
var percent = num(size)
if (size === 'auto' || size === 'cover' || percent <= 100) {
  return 'background-size is "' + size + '". With nothing bigger than the stage to pan across, the animation has nowhere to travel.'
}
return true`,
    },
    {
      id: 'animated',
      label: 'The background animates',
      code: `var name = css(doc.body).animationName
if (!name || name === 'none') {
  return 'The body has no animation-name, so nothing moves.'
}
return true`,
    },
    {
      id: 'keyframes',
      label: 'The animation has keyframes to run',
      code: `var name = css(doc.body).animationName
var frames = keyframes(name)
if (!frames) {
  return 'There is no @keyframes rule named "' + name + '". The animation has nothing to play.'
}
return true`,
    },
    {
      id: 'duration',
      label: 'The drift is slow enough to be pleasant',
      code: `var seconds = num(css(doc.body).animationDuration)
if (seconds < 2) {
  return 'A ' + seconds + 's cycle is fast enough to be distracting. Something between 4s and 12s reads as calm.'
}
if (seconds > 20) {
  return 'A ' + seconds + 's cycle is so slow it looks broken. Bring it under 20s.'
}
return true`,
    },
    {
      id: 'reduced-motion',
      label: 'Motion is switched off when the system asks',
      code: `var stopped = false
walkRules(function (rule) {
  if (rule.type !== 4 || !rule.media || !/prefers-reduced-motion/.test(rule.media.mediaText)) return
  var inner = rule.cssRules || []
  for (var i = 0; i < inner.length; i++) {
    var selector = inner[i].selectorText || ''
    if (!/body/.test(selector)) continue
    var animation = inner[i].style.getPropertyValue('animation')
    var name = inner[i].style.getPropertyValue('animation-name')
    if (animation === 'none' || name === 'none') stopped = true
  }
})
if (!stopped) {
  return 'Inside a prefers-reduced-motion block, set animation: none on the body. That setting exists for exactly this kind of background.'
}
return true`,
    },
  ],
}
