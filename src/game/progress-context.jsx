import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  clearState,
  readState,
  recordRun,
  rememberLevel,
  setUnlockAll as applyUnlockAll,
  writeState,
} from '@/lib/store.js'

const ProgressContext = createContext(null)

export function ProgressProvider({ children }) {
  const [state, setState] = useState(() => readState())

  useEffect(() => {
    writeState(state)
  }, [state])

  const record = useCallback((levelId, run) => {
    setState((current) => recordRun(current, levelId, run))
  }, [])

  const remember = useCallback((levelId) => {
    setState((current) => rememberLevel(current, levelId))
  }, [])

  const setUnlockAll = useCallback((value) => {
    setState((current) => applyUnlockAll(current, value))
  }, [])

  const reset = useCallback(() => {
    setState(clearState())
  }, [])

  const value = useMemo(
    () => ({ state, record, remember, setUnlockAll, reset }),
    [state, record, remember, setUnlockAll, reset],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const value = useContext(ProgressContext)
  if (!value) throw new Error('useProgress needs a ProgressProvider above it.')
  return value
}
