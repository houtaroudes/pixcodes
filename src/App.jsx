import { Link, Route, Routes } from 'react-router-dom'
import LevelMap from './components/LevelMap.jsx'
import PlayfieldRoute from './components/Playfield.jsx'
import XpBar from './components/XpBar.jsx'
import { Toaster } from '@/components/ui/sonner.jsx'
import { LEVELS } from '@/game/levels/index.js'
import { ProgressProvider, useProgress } from '@/game/progress-context.jsx'
import { totalEarnedXp, totalPossibleXp } from '@/lib/levels.js'

function Header() {
  const { state } = useProgress()

  return (
    <header className="border-b bg-card/60">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <Link
          to="/"
          className="rounded-sm font-display text-base font-bold tracking-tight outline-offset-4"
        >
          PixCodes
        </Link>
        <XpBar
          earned={totalEarnedXp(state.progress)}
          possible={totalPossibleXp(LEVELS)}
          levels={LEVELS}
          compact
        />
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-auto border-t px-5 py-5">
      <p className="mx-auto w-full max-w-6xl text-xs text-muted-foreground">
        PixCodes, a Random Web Dev build by Bryan Sacueza. The target, your attempt and the checks
        all run in your browser, in frames that cannot reach this page.
      </p>
    </footer>
  )
}

export default function App() {
  return (
    <ProgressProvider>
      <div className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LevelMap levels={LEVELS} />} />
            <Route path="/play/:levelId" element={<PlayfieldRoute />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <Toaster position="bottom-center" />
    </ProgressProvider>
  )
}

function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="font-display text-2xl font-bold">That page is not on the map</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Head back to the board and pick a level.
      </p>
      <Link className="mt-5 inline-block text-sm underline underline-offset-4" to="/">
        Back to the board
      </Link>
    </div>
  )
}
