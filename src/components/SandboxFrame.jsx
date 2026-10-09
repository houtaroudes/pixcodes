import { HARNESS_HTML } from '@/game/runtime/harness.js'
import { cn } from '@/lib/cn.js'

/**
 * One sandboxed frame. `sandbox="allow-scripts"` grants script execution and
 * nothing else: no same-origin access, no top navigation, no forms, no popups.
 * With `allow-same-origin` absent the frame runs on an opaque origin, which is
 * what makes the escape impossible rather than merely discouraged.
 */
export default function SandboxFrame({ title, onFrame, className }) {
  return (
    <iframe
      title={title}
      ref={onFrame}
      sandbox="allow-scripts"
      srcDoc={HARNESS_HTML}
      className={cn('block w-full border-0 bg-white', className)}
    />
  )
}
