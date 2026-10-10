import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon, CircleCheckIcon, LockIcon, PlayIcon, RotateCcwIcon } from 'lucide-react'
import Editor from './Editor.jsx'
import SandboxFrame from './SandboxFrame.jsx'
import TargetPreview from './TargetPreview.jsx'
import CheckList from './CheckList.jsx'
import ResultDialog from './ResultDialog.jsx'
import { Button } from '@/components/ui/button.jsx'
import { LEVELS } from '@/game/levels/index.js'
import { useProgress } from '@/game/progress-context.jsx'
import { toFrameChecks } from '@/game/runtime/check-helpers.js'
import { createSandbox } from '@/game/runtime/sandbox.js'
import { computeXp, gradeLevel, unmeasuredLevel } from '@/lib/judge.js'
import { isUnlocked, levelMode, nextLevel } from '@/lib/levels.js'
import { clearDraft, readDraft, writeDraft } from '@/lib/store.js'

/**
 * What gets rendered for a given level.
 *
 * A `css` level styles markup that belongs to the level, so only the CSS comes
 * from the editor. A `document` level hands over everything, so the editor's
 * content is the document and the harness stops wrapping it.
 */
function buildPayload(level, code) {
  if (levelMode(level) === 'document') {
    return { html: code, css: '', wrap: false }
  }
  return { html: level.reference.html ?? '', css: code, wrap: true }
}

export default function PlayfieldRoute() {
  const { levelId } = useParams()
  return <Playfield key={levelId} levelId={levelId} />
}

function Playfield({ levelId }) {
  const level = LEVELS.find((candidate) => candidate.id === levelId)
  const { state, record } = useProgress()

  const [code, setCode] = useState(() => readDraft(levelId) ?? level?.starter ?? '')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState(null)
  const [outcome, setOutcome] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const frameRef = useRef(null)
  const sandboxRef = useRef(null)
  const startedAtRef = useRef(Date.now())
  const codeRef = useRef(code)
  codeRef.current = code

  /* Paint the starting point as soon as the sandbox answers, so the panel on the
     right is never blank. No checks are sent, so this is not a run. */
  useEffect(() => {
    const frame = frameRef.current
    if (!frame || !level) return undefined
    const sandbox = createSandbox(frame)
    sandboxRef.current = sandbox
    sandbox.run({ ...buildPayload(level, codeRef.current), checks: [] })

    return () => {
      sandbox.dispose()
      sandboxRef.current = null
    }
  }, [level])

  const handleCodeChange = useCallback(
    (next) => {
      setCode(next)
      writeDraft(levelId, next)
    },
    [levelId],
  )

  const run = useCallback(async () => {
    const sandbox = sandboxRef.current
    if (!sandbox || !level || running) return

    setRunning(true)
    const attempt = (state.progress[level.id]?.attempts ?? 0) + 1

    const payload = buildPayload(level, code)
    const reported = await sandbox.run({ ...payload, checks: toFrameChecks(level.checks) })
    const durationMs = Date.now() - startedAtRef.current

    /* An error here means the frame never measured the page at all, which is not
       the same as a page that failed every check. Grading it would invent a
       failure for every check and call each one an authoring bug. */
    const measured = !reported.error && !reported.timedOut
    const graded = measured
      ? gradeLevel(level.checks, reported.outcomes)
      : unmeasuredLevel(level.checks)

    const notes = reported.error ? [reported.error, ...reported.notes] : reported.notes
    setResults({ ...graded, notes })

    const { xp, speedBonus, firstTryBonus } = computeXp({
      baseXp: level.xp,
      score: graded.score,
      allPassed: graded.allPassed,
      durationMs,
      attempts: attempt,
    })

    /* Only a run that was actually measured counts as an attempt, so a frame
       that went quiet cannot cost the player a score or their first try. */
    if (measured) {
      record(level.id, { score: graded.score, xp, allPassed: graded.allPassed, durationMs })
    }
    setOutcome({ ...graded, xp, speedBonus, firstTryBonus, durationMs, notes })
    setDialogOpen(true)
    setRunning(false)
  }, [code, level, record, running, state.progress])

  /* Ctrl or Cmd with Enter runs the checks, so the level is playable without
     reaching for the mouse. */
  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        run()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [run])

  if (!level) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="font-display text-2xl font-bold">No level by that name</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The board has {LEVELS.length} levels, and that address is not one of them.
        </p>
        <Button asChild className="mt-5">
          <Link to="/">Back to the board</Link>
        </Button>
      </div>
    )
  }

  const unlocked = isUnlocked(LEVELS, state.progress, level.id, { unlockAll: state.unlockAll })

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <LockIcon className="size-5" aria-hidden="true" />
          {level.title} is locked
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Levels open one at a time. Clear level {level.ordinal - 1} and this one opens. If you
          would rather read through the whole board, the level map has a switch that opens
          everything.
        </p>
        <Button asChild className="mt-5">
          <Link to="/">Back to the board</Link>
        </Button>
      </div>
    )
  }

  const entry = state.progress[level.id]
  const mode = levelMode(level)
  const next = nextLevel(LEVELS, level.id)
  const cleared = Boolean(entry?.cleared)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/">
            <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
            Board
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {entry && (
            <span className="font-mono">
              Best {entry.score}%, {entry.attempts} {entry.attempts === 1 ? 'run' : 'runs'}
            </span>
          )}
          {/* An icon and a word, never the green alone: status has to survive
              being read without colour. */}
          {cleared && (
            <span className="flex items-center gap-1 text-pass">
              <CircleCheckIcon className="size-3.5" aria-hidden="true" />
              Cleared
            </span>
          )}
        </div>
      </div>

      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">
            {String(level.ordinal).padStart(2, '0')}
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight">{level.title}</h1>
          {/* Mono, like every other number in the app: the xp is data about the
              level, and the mono face is what separates data from prose here. */}
          <span className="font-mono text-xs text-muted-foreground">{level.xp} xp</span>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">{level.brief}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <TargetPreview level={level} />
          {mode === 'css' ? (
            <details className="rounded-xl border bg-card px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium">
                The markup you are styling
              </summary>
              <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-relaxed text-muted-foreground">
                {level.reference.html}
              </pre>
            </details>
          ) : (
            <p className="rounded-xl border border-dashed px-3 py-2 text-sm text-muted-foreground">
              This level gives you the whole document, so the markup and the script are yours to
              write. The target on the left shows what the finished page should do.
            </p>
          )}
        </div>

        <section aria-label="Your attempt" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-sm font-semibold">
              Your {mode === 'document' ? 'document' : 'styles'}
            </h2>
            <span className="font-mono text-[11px] text-muted-foreground">
              {mode === 'document' ? 'index.html' : 'style.css'}
            </span>
          </div>

          <div className="sheet h-[320px] overflow-hidden rounded-xl border border-sheet-line bg-sheet">
            <Editor
              value={code}
              onChange={handleCodeChange}
              language={mode === 'document' ? 'html' : 'css'}
              label="Your code for this level"
            />
          </div>

          <div className="overflow-hidden rounded-xl border bg-card">
            <SandboxFrame
              title={`Your attempt at ${level.title}`}
              onFrame={(node) => {
                frameRef.current = node
              }}
              className="h-[240px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={run} disabled={running} className="gap-1.5">
              <PlayIcon className="size-4" aria-hidden="true" />
              {running ? 'Running' : 'Run the checks'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                clearDraft(level.id)
                handleCodeChange(level.starter)
                startedAtRef.current = Date.now()
              }}
              className="gap-1.5"
            >
              <RotateCcwIcon className="size-3.5" aria-hidden="true" />
              Start over
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                handleCodeChange(level.reference.css || level.reference.html)
              }
            >
              Load the target
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Control or Command with Enter runs the checks. Your work is saved as you type, so a
            refresh will not lose it.
          </p>
        </section>
      </div>

      <section aria-label="Check results">
        <CheckList
          results={results}
          idle="Press Run the checks to see how your attempt compares with the target."
        />
      </section>

      <ResultDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        level={level}
        outcome={outcome}
        next={next}
      />
    </div>
  )
}
