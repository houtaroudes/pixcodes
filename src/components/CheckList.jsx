import { CircleCheckIcon, CircleXIcon } from 'lucide-react'
import { cn } from '@/lib/cn.js'

/**
 * Results are never colour alone. Every check carries an icon and a spoken word,
 * so the list still reads for someone who cannot separate the orange from the
 * red, and state is announced rather than only shown.
 */
export default function CheckList({ results, idle }) {
  if (!results) {
    return (
      <p className="rounded-xl border border-dashed px-3 py-4 text-sm text-muted-foreground">
        {idle}
      </p>
    )
  }

  const passed = results.checks.filter((check) => check.ok)
  const failed = results.checks.filter((check) => !check.ok)

  /*
   * A run that never reached the page leaves every check unknown. Listing them
   * all as failures would read as "your code is wrong", so this branch lists the
   * checks plainly and puts the reason in the notes below instead.
   */
  if (results.unmeasured) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-xl border border-dashed px-3 py-4 text-sm" role="status">
          <span className="font-semibold">The checks could not be measured.</span>{' '}
          <span className="text-muted-foreground">
            Nothing was graded, so this run says nothing about your code or the level. Try running
            it again.
          </span>
        </p>
        <ul className="flex flex-col gap-2">
          {results.checks.map((check) => (
            <li key={check.id} className="rounded-xl border border-dashed px-3 py-2">
              <p className="text-sm text-muted-foreground">
                <span className="sr-only">Not measured. </span>
                {check.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" role="status">
        <span className="font-semibold">
          {passed.length} of {results.total} checks passed
        </span>
        {failed.length > 0 ? (
          <span className="text-muted-foreground">, read the first failure below</span>
        ) : (
          <span className="text-pass">, cleared</span>
        )}
      </p>

      <ul className="flex flex-col gap-2">
        {results.checks.map((check) => (
          <li
            key={check.id}
            className={cn(
              'rounded-xl border px-3 py-2',
              check.ok ? 'border-border bg-card' : 'border-fail/40 bg-fail/5',
            )}
          >
            <div className="flex items-start gap-2">
              {check.ok ? (
                <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-pass" aria-hidden="true" />
              ) : (
                <CircleXIcon className="mt-0.5 size-4 shrink-0 text-fail" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="sr-only">{check.ok ? 'Pass. ' : 'Fail. '}</span>
                  {check.label}
                </p>
                {!check.ok && check.message && (
                  <p className="mt-1 text-sm text-muted-foreground">{check.message}</p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {results.notes?.length > 0 && (
        <div className="rounded-xl border border-dashed px-3 py-2">
          <p className="text-xs font-semibold">Your script reported an error</p>
          <ul className="mt-1 flex flex-col gap-1">
            {results.notes.map((note, index) => (
              <li key={`${index}-${note}`} className="font-mono text-[11px] text-muted-foreground">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
