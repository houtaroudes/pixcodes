import { Link } from 'react-router-dom'
import { CircleCheckIcon, LockIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge.jsx'
import { cn } from '@/lib/cn.js'

const TIER_LABEL = { 1: 'Warm up', 2: 'Build it', 3: 'Get clever' }

export default function LevelCard({ level, entry, unlocked, lockedBy }) {
  const cleared = Boolean(entry?.cleared)
  const attempted = Boolean(entry && entry.attempts > 0)
  const score = entry?.score ?? 0

  const body = (
    <article
      className={cn(
        'flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition-shadow',
        unlocked && 'hover:shadow-md',
        cleared && 'border-pass/40',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[11px] text-muted-foreground">
          {String(level.ordinal).padStart(2, '0')}
        </p>
        <Badge variant={cleared ? 'secondary' : 'outline'} className="shrink-0">
          {TIER_LABEL[level.tier] ?? 'Level'}
        </Badge>
      </div>

      <h3 className="font-display text-base font-semibold">{level.title}</h3>

      <p className="line-clamp-3 text-sm text-muted-foreground">
        {unlocked ? level.brief : `Clear level ${lockedBy} to open this one.`}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="font-mono text-[11px] text-muted-foreground">
          {level.xp} / {Math.round(level.xp * 1.2)} xp
        </span>
        {cleared ? (
          <span className="flex items-center gap-1 text-xs text-pass">
            <CircleCheckIcon className="size-3.5" aria-hidden="true" />
            Cleared
          </span>
        ) : attempted ? (
          <span className="text-xs text-muted-foreground">
            Best {score}%, {entry.attempts} {entry.attempts === 1 ? 'run' : 'runs'}
          </span>
        ) : unlocked ? (
          <span className="text-xs text-muted-foreground">Not started</span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <LockIcon className="size-3.5" aria-hidden="true" />
            Locked
          </span>
        )}
      </div>
    </article>
  )

  if (!unlocked) {
    return <div className="h-full opacity-70">{body}</div>
  }

  return (
    <Link
      to={`/play/${level.id}`}
      className="h-full rounded-xl outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring"
    >
      {body}
    </Link>
  )
}
