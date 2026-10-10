import { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { css as cssLanguage } from '@codemirror/lang-css'
import { html as htmlLanguage } from '@codemirror/lang-html'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

/*
 * The editor is one of the two lit sheets in PixCodes, and it is lit for the same
 * reason the target is: the player is comparing a rendered document with a
 * written one, so both are the same white paper on a dark desk. Navy ink, and the
 * deep orange for structure, which is the accent at the strength that survives on
 * paper. Every value below was measured against the sheet rather than picked by
 * eye: ink 15.67:1, deep orange 5.86:1, muted 6.00:1, and the deep orange on an
 * active line 5.21:1, which all clear AA for text this size.
 */
const sheetTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#ffffff',
      color: '#13233f',
      fontSize: '13px',
      height: '100%',
    },
    '.cm-scroller': {
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      lineHeight: '1.7',
    },
    '.cm-content': { caretColor: '#a8471a', padding: '12px 0' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#a8471a', borderLeftWidth: '2px' },
    '.cm-gutters': {
      backgroundColor: '#ffffff',
      color: '#5a6472',
      border: 'none',
      paddingRight: '4px',
    },
    '.cm-activeLine': { backgroundColor: '#f2f2ea' },
    '.cm-activeLineGutter': { backgroundColor: '#f2f2ea', color: '#5a6472' },
    '.cm-selectionBackground, .cm-content ::selection': { backgroundColor: '#cfd8e6' },
    '&.cm-focused .cm-selectionBackground': { backgroundColor: '#cfd8e6' },
    '.cm-matchingBracket': { backgroundColor: '#cfd8e6', color: '#13233f' },
  },
  { dark: false },
)

const sheetHighlight = HighlightStyle.define([
  /* The sheet's own muted tone, not a greyer one: a comment is still text the
     player reads, and this measures 6.00:1 on the sheet and 5.33:1 on an active
     line. */
  { tag: tags.comment, color: '#5a6472', fontStyle: 'italic' },
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
    color: '#a8471a',
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
    color: '#13233f',
  },
  { tag: tags.invalid, color: '#b3261e' },
])

export default function Editor({ value, onChange, label, language = 'css' }) {
  const extensions = useMemo(
    () => [
      language === 'html' ? htmlLanguage() : cssLanguage(),
      sheetTheme,
      syntaxHighlighting(sheetHighlight),
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
