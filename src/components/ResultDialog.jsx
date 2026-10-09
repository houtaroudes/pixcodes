import { CircleCheckIcon, CircleXIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx'
import { Button } from '@/components/ui/button.jsx'
import { formatDuration } from '@/lib/judge.js'

export default function ResultDialog({ open, onOpenChange, level, outcome, next }) {
  if (!level || !outcome) return null

  const cleared = outcome.allPassed
  const unmeasured = Boolean(outcome.unmeasured)
  const failures = outcome.checks.filter((check) => !check.ok)
  const firstFailure = failures[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {cleared ? (
              <CircleCheckIcon className="size-5 text-pass" aria-hidden="true" />
            ) : (
              <CircleXIcon className="size-5 text-fail" aria-hidden="true" />
            )}
            {cleared ? `${level.title} cleared` : unmeasured ? 'Nothing was measured' : 'Not cleared yet'}
          </DialogTitle>
          <DialogDescription>
            {cleared
              ? `Every one of the ${outcome.total} checks agreed with the target.`
              : unmeasured
                ? 'The checks never reached the page, so this run says nothing about your code. Nothing was recorded against this level.'
                : `${outcome.passed} of ${outcome.total} checks passed. The list below stays on the page while you work.`}
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border px-3 py-2">
            <dt className="text-xs text-muted-foreground">Checks</dt>
            <dd className="mt-0.5 font-mono">
              {unmeasured ? 'not measured' : `${outcome.passed} / ${outcome.total}`}
            </dd>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <dt className="text-xs text-muted-foreground">Time on this level</dt>
            <dd className="mt-0.5 font-mono">{formatDuration(outcome.durationMs)}</dd>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <dt className="text-xs text-muted-foreground">Experience</dt>
            <dd className="mt-0.5 font-mono">+{outcome.xp} xp</dd>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <dt className="text-xs text-muted-foreground">Bonuses</dt>
            <dd className="mt-0.5 font-mono">
              {outcome.speedBonus > 0 || outcome.firstTryBonus > 0
                ? `+${outcome.speedBonus + outcome.firstTryBonus}`
                : 'none'}
            </dd>
          </div>
        </dl>

        {!cleared && unmeasured && (
          <p className="rounded-lg border border-dashed px-3 py-2 text-sm">
            <span className="font-medium">Why: </span>
            {outcome.notes?.[0] ?? 'The run did not finish. Try running it again.'}
          </p>
        )}

        {!cleared && !unmeasured && firstFailure && (
          <p className="rounded-lg border border-fail/40 bg-fail/5 px-3 py-2 text-sm">
            <span className="font-medium">Start with: </span>
            {firstFailure.message || firstFailure.label}
          </p>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep working
          </Button>
          {cleared && next ? (
            <Button asChild>
              <Link to={`/play/${next.id}`}>Next: {next.title}</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/">Back to the board</Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
