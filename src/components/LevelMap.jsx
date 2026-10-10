import { Link } from 'react-router-dom'
import { RotateCcwIcon } from 'lucide-react'
import LevelCard from './LevelCard.jsx'
import XpBar from './XpBar.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { useProgress } from '@/game/progress-context.jsx'
import {
  clearedCount,
  isUnlocked,
  playerRank,
  sortLevels,
  totalEarnedXp,
  totalPossibleXp,
} from '@/lib/levels.js'

export default function LevelMap({ levels }) {
  const { state, setUnlockAll, reset } = useProgress()
  const ordered = sortLevels(levels)
  const earned = totalEarnedXp(state.progress)
  const possible = totalPossibleXp(levels)
  const cleared = clearedCount(levels, state.progress)
  const rank = playerRank(earned, levels)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-10">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Match the target
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A board of small front-end puzzles. Each one shows a rendered target, and you write
              the CSS or the whole document until the checks agree with it. Everything runs in a
              sandbox in this browser tab, and your progress is saved here on this machine.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <XpBar earned={earned} possible={possible} levels={levels} />
            <p className="text-xs text-muted-foreground">
              {cleared} of {ordered.length} cleared, rank: {rank.label}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-dashed px-4 py-3">
          <div className="flex items-center gap-2">
            <Switch
              id="unlock-all"
              checked={state.unlockAll}
              onCheckedChange={setUnlockAll}
            />
            <Label htmlFor="unlock-all" className="text-sm">
              Open every level
            </Label>
            <span className="text-xs text-muted-foreground">
              for reading through the whole board without replaying it
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
            <RotateCcwIcon className="size-3.5" aria-hidden="true" />
            Clear my progress
          </Button>
        </div>
      </header>

      <section aria-label="Levels" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((level, index) => (
          <LevelCard
            key={level.id}
            level={level}
            entry={state.progress[level.id]}
            unlocked={isUnlocked(levels, state.progress, level.id, { unlockAll: state.unlockAll })}
            lockedBy={ordered[index - 1]?.ordinal ?? ''}
          />
        ))}
      </section>

      <footer className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
        Everything is graded inside a sandboxed frame that cannot reach this page, its storage or
        its cookies. There is no scoreboard yet, so a cleared level is only ever your own record.
        {state.lastPlayedId && (
          <>
            {' '}
            <Link className="underline underline-offset-2" to={`/play/${state.lastPlayedId}`}>
              Back to where you left off
            </Link>
            .
          </>
        )}
      </footer>
    </div>
  )
}
