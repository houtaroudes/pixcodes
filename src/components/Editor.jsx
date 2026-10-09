import { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { css as cssLanguage } from '@codemirror/lang-css'
import { html as htmlLanguage } from '@codemirror/lang-html'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

/*
 * The stage is the only dark surface in PixCodes, and the syntax palette stays
 * inside the same four colours as the rest of the app: orange for the structural
 * tokens, cream for values, grey for comments. No fifth hue, so the editor reads
 * as part of the page rather than a pasted theme.
 */
const stageTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#13233f',
      color: '#f4f4ed',
      fontSize: '13px',
      height: '100%',
    },
    '.cm-scroller': {
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      lineHeight: '1.7',
    },
    '.cm-content': { caretColor: '#f26b1d', padding: '12px 0' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#f26b1d', borderLeftWidth: '2px' },
    '.cm-gutters': {
      backgroundColor: '#13233f',
      color: '#5a6472',
      border: 'none',
      paddingRight: '4px',
    },
    '.cm-activeLine': { backgroundColor: '#1b2d4d' },
    '.cm-activeLineGutter': { backgroundColor: '#1b2d4d', color: '#96a3b8' },
    '.cm-selectionBackground, .cm-content ::selection': { backgroundColor: '#2c4370' },
    '&.cm-focused .cm-selectionBackground': { backgroundColor: '#2c4370' },
    '.cm-matchingBracket': { backgroundColor: '#2c4370', color: '#f4f4ed' },
  },
  { dark: true },
)

const stageHighlight = HighlightStyle.define([
  /* The stage's own muted tone, not a greyer one: a comment is still text the
     player reads, and this measures 6.14:1 on the stage and 5.38:1 on an active
     line, where the previous colour fell to 3.93:1. */
  { tag: tags.comment, color: '#96a3b8', fontStyle: 'italic' },
  {
    tag: [
      tags.keyword,
      tags.atom,
      tags.bool,
      tags.tagName,
      tags.attributeName,
      tags.propertyName,
      tags.className,
      tags.labelName,
      tags.definition(tags.propertyName),
      tags.definition(tags.variableName),
    ],
    color: '#f26b1d',
  },
  {
    tag: [
      tags.name,
      tags.variableName,
      tags.string,
      tags.number,
      tags.unit,
      tags.operator,
      tags.punctuation,
      tags.bracket,
      tags.separator,
      tags.meta,
    ],
    color: '#f4f4ed',
  },
  { tag: tags.invalid, color: '#ff8f86' },
])

export default function Editor({ value, onChange, label, language = 'css' }) {
  const extensions = useMemo(
    () => [
      language === 'html' ? htmlLanguage() : cssLanguage(),
      stageTheme,
      syntaxHighlighting(stageHighlight),
    ],
    [language],
  )

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      height="100%"
      className="h-full text-left"
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
        foldGutter: false,
        tabSize: 2,
      }}
      aria-label={label}
    />
  )
}
