export default {
  id: 'floating-label',
  ordinal: 5,
  title: 'A label that floats',
  tier: 2,
  xp: 80,
  brief:
    'A 220px field where the label starts inside the box and rises out of the way once you type. CSS only: :placeholder-shown is what makes it possible without script.',
  reference: {
    html: `<label class="field">
  <input type="email" placeholder=" " />
  <span class="label">Email address</span>
</label>`,
    css: `body {
  display: flex;
  align-items: center;
  justify-content: center;
}

.field {
  position: relative;
  width: 220px;
}

.field input {
  width: 100%;
  height: 52px;
  padding: 20px 14px 6px;
  border: 1px solid #dcdcd2;
  border-radius: 10px;
  background: #ffffff;
  font: inherit;
  font-size: 14px;
  color: #13233f;
}

.field .label {
  position: absolute;
  left: 14px;
  top: 16px;
  font-size: 14px;
  color: #5a6472;
  pointer-events: none;
  transition: top 150ms ease, font-size 150ms ease;
}

.field input:focus + .label,
.field input:not(:placeholder-shown) + .label {
  top: 6px;
  font-size: 11px;
}`,
  },
  starter: `/* The box is drawn. Make the label behave. */
body {
  display: flex;
  align-items: center;
  justify-content: center;
}

.field {
  position: relative;
  width: 220px;
}

.field input {
  width: 100%;
  height: 52px;
  padding: 20px 14px 6px;
  border: 1px solid #dcdcd2;
  border-radius: 10px;
  background: #ffffff;
  font: inherit;
  font-size: 14px;
  color: #13233f;
}

.field .label {
  left: 14px;
  top: 16px;
  font-size: 14px;
  color: #5a6472;
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
      id: 'input',
      label: 'The field is 220px wide',
      code: `var r = box(need('.field input'))
if (!near(r.width, 220, 2)) {
  return 'The input should be 220px wide. It measures ' + num(r.width) + 'px.'
}
return true`,
    },
    {
      id: 'placeholder',
      label: 'The input carries a blank placeholder',
      code: `var input = need('.field input')
var placeholder = input.getAttribute('placeholder')
if (placeholder === null || placeholder.length === 0) {
  return 'The input needs a placeholder holding nothing but whitespace, so :placeholder-shown can tell an empty field from a filled one.'
}
if (placeholder.trim().length > 0) {
  return 'The placeholder reads "' + placeholder + '". Keep it blank, otherwise it competes with the label.'
}
return true`,
    },
    {
      id: 'label-inside',
      label: 'The label starts inside the field',
      code: `var label = box(need('.field .label'))
var field = box(need('.field input'))
if (label.top < field.top || label.top > field.top + field.height) {
  return 'The label should start inside the input at rest. It sits at ' + num(label.top - field.top) + 'px from the input\\'s top.'
}
if (label.left - field.left < 6) {
  return 'The label is ' + num(label.left - field.left) + 'px from the input edge, which is tight against the border.'
}
return true`,
    },
    {
      id: 'positioned',
      label: 'The label is positioned against the field',
      code: `var position = css(need('.field .label')).position
if (position !== 'absolute' && position !== 'fixed') {
  return 'The label reports position: ' + position + '. It needs to be absolute so it can move without shifting the input.'
}
return true`,
    },
    {
      id: 'focus-rule',
      label: 'Focus moves the label',
      code: `var rule = declares(/:focus/, 'top') || declares(/:focus/, 'font-size') || declares(/:focus/, 'transform')
if (!rule) {
  return 'No :focus rule moves the label. Clicking the field should lift it.'
}
return true`,
    },
    {
      id: 'placeholder-shown',
      label: 'The label stays up once there is text',
      code: `var rule = declares(/:placeholder-shown/, 'top') || declares(/:placeholder-shown/, 'font-size') || declares(/:placeholder-shown/, 'transform')
if (!rule) {
  return 'Without a :placeholder-shown rule the label drops back down as soon as you click away, even with text in the field.'
}
return true`,
    },
    {
      id: 'shrinks',
      label: 'The label gets smaller as it rises',
      code: `var rule = declares(/:focus/, 'font-size') || declares(/:placeholder-shown/, 'font-size')
if (!rule) {
  return 'The label moves but never changes size, so it still crowds the text you type.'
}
var size = num(rule.style.fontSize)
if (size === 0 || size >= 14) {
  return 'The floated label is ' + size + 'px. Make it smaller than the 14px resting size.'
}
return true`,
    },
    {
      id: 'click-through',
      label: 'The label does not swallow clicks',
      code: `var pointer = css(need('.field .label')).pointerEvents
if (pointer !== 'none') {
  return 'The label reports pointer-events: ' + pointer + ', so clicking the label may not reach the input.'
}
return true`,
    },
  ],
}
