import { Progress } from '@/components/ui/progress.jsx'
import { playerRank } from '@/lib/levels.js'

export default function XpBar({ earned, possible, levels, compact = false }) {
  const percent = possible > 0 ? Math.round((earned / possible) * 100) : 0
  const rank = playerRank(earned, levels)

  return (
    <div className="flex items-center gap-3">
      <Progress
        value={percent}
        className={compact ? 'h-1.5 w-24' : 'h-2 w-40'}
        aria-label={`Experience earned: ${earned} of ${possible} points, ${percent} percent`}
      />
      <p className="text-xs text-muted-foreground">
        <span className="font-mono">
          {earned}
          {/* Full strength, not muted at 60 percent: that blend lands at 2.45:1
              on the paper background, and at 12px it has to clear 4.5:1. */}
          <span className="text-muted-foreground"> / {possible}</span>
        </span>
        {!compact && <span className="ml-2">{rank.label}</span>}
      </p>
    </div>
  )
}
