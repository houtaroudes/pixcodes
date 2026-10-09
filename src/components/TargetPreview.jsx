import { useEffect, useRef } from 'react'
import SandboxFrame from './SandboxFrame.jsx'
import { createSandbox } from '@/game/runtime/sandbox.js'
import { STAGE_HEIGHT, STAGE_WIDTH } from '@/game/runtime/check-helpers.js'
import { LockIcon } from 'lucide-react'

/**
 * The target is the level's own reference solution, rendered through the same
 * harness the player's attempt uses, so the two are measured in identical
 * conditions. Pointer events are left on deliberately: it lets a player scroll a
 * tall target or try the reference behaviour before writing anything.
 */
export default function TargetPreview({ level }) {
  const frameRef = useRef(null)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame || !level) return undefined

    const sandbox = createSandbox(frame)
    sandbox.run({
      html: level.reference.html ?? '',
      css: level.reference.css ?? '',
      checks: [],
    })

    return () => sandbox.dispose()
  }, [level])

  return (
    <section aria-label="Target" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 font-display text-sm font-semibold">
          <LockIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
          Target
        </h2>
        <span className="font-mono text-[11px] text-muted-foreground">
          {STAGE_WIDTH} x {STAGE_HEIGHT}
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <SandboxFrame
          title={`Target for ${level.title}`}
          onFrame={(node) => {
            frameRef.current = node
          }}
          className="h-[240px]"
        />
      </div>
    </section>
  )
}
