import { useState, useRef, useCallback } from 'react'
export interface LapRecord { index: number; lapMs: number; totalMs: number }
export function useStopwatch() {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [laps, setLaps]       = useState<LapRecord[]>([])
  const startRef  = useRef<number>(0)
  const baseRef   = useRef<number>(0)
  const rafRef    = useRef<number>(0)
  const lastLapMs = useRef<number>(0)
  const tick = useCallback(() => {
    setElapsed(baseRef.current + performance.now() - startRef.current)
    rafRef.current = requestAnimationFrame(tick)
  }, [])
  const start = useCallback(() => {
    if (running) return
    startRef.current = performance.now()
    setRunning(true)
    rafRef.current = requestAnimationFrame(tick)
  }, [running, tick])
  const stop = useCallback(() => {
    if (!running) return
    cancelAnimationFrame(rafRef.current)
    baseRef.current += performance.now() - startRef.current
    setRunning(false)
  }, [running])
  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setRunning(false); setElapsed(0); setLaps([])
    baseRef.current = 0; lastLapMs.current = 0
  }, [])
  const lap = useCallback(() => {
    if (!running) return
    const total = baseRef.current + performance.now() - startRef.current
    const lapMs = total - lastLapMs.current
    lastLapMs.current = total
    setLaps(prev => [...prev, { index: prev.length + 1, lapMs, totalMs: total }])
  }, [running])
  return { elapsed, running, laps, start, stop, reset, lap }
}