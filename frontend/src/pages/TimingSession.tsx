import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { subscribeAthletes, saveTime, createSession } from '../lib/firestore'
import { useStopwatch } from '../hooks/useStopwatch'
import type { Athlete, EventType } from '../types'
import { TIMED_EVENTS, formatTime } from '../types'
import { Play, Square, RotateCcw, Flag, Save, CheckCircle } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
export default function TimingSession() {
  const { teamId } = useAuth()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [event, setEvent]       = useState<EventType>('100m')
  const [selected, setSelected] = useState<string[]>([])
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const { elapsed, running, laps, start, stop, reset, lap } = useStopwatch()
  useEffect(() => { if (!teamId) return; return subscribeAthletes(teamId, setAthletes) }, [teamId])
  const toggleAthlete = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const handleSave = async () => {
    if (!teamId || selected.length === 0 || elapsed === 0) return
    setSaving(true)
    const sessionRef = await createSession({ teamId, coachId: '', event, date: Timestamp.now(), notes })
    await Promise.all(selected.map(athleteId => saveTime({ athleteId, teamId, event, timeMs: Math.round(elapsed), splits: laps.map((l, i) => ({ label: `Lap ${i + 1}`, timeMs: l.lapMs })), sessionId: sessionRef.id, notes })))
    setSaving(false); setSaved(true); reset(); setSelected([])
    setTimeout(() => setSaved(false), 3000)
  }
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div><h1 className="text-2xl font-bold text-gray-900">Live Timing</h1></div>
      <div className="card"><label className="text-sm font-medium text-gray-700 block mb-2">Event</label><select className="input" value={event} onChange={e => setEvent(e.target.value as EventType)}>{TIMED_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}</select></div>
      <div className="card text-center">
        <div className="font-mono text-6xl font-bold text-gray-900 tracking-tight my-4 tabular-nums">{formatTime(elapsed)}</div>
        <div className="flex justify-center gap-3">
          {!running ? <button onClick={start} className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600"><Play size={18} /> Start</button>
            : <button onClick={stop} className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600"><Square size={18} /> Stop</button>}
          <button onClick={lap} disabled={!running} className="flex items-center gap-2 btn-secondary px-5 py-3 disabled:opacity-40"><Flag size={16} /> Lap</button>
          <button onClick={reset} disabled={running} className="flex items-center gap-2 btn-secondary px-5 py-3 disabled:opacity-40"><RotateCcw size={16} /> Reset</button>
        </div>
        {laps.length > 0 && <div className="mt-4 border-t pt-4 space-y-1">{laps.map((l, i) => <div key={i} className="flex justify-between text-sm text-gray-600"><span>Lap {l.index}</span><span className="font-mono">{formatTime(l.lapMs)}</span><span className="font-mono text-gray-400">{formatTime(l.totalMs)}</span></div>)}</div>}
      </div>
      <div className="card"><label className="text-sm font-medium text-gray-700 block mb-3">Athletes ({selected.length})</label><div className="space-y-2 max-h-60 overflow-y-auto">{athletes.map(a => <label key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggleAthlete(a.id)} className="w-4 h-4 accent-brand-600" /><span className="text-sm">{a.name}</span></label>)}</div></div>
      <div><label className="text-sm font-medium text-gray-700 block mb-1">Notes</label><textarea className="input resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} /></div>
      <button className="btn-primary w-full flex items-center justify-center gap-2 py-3" onClick={handleSave} disabled={saving || elapsed === 0 || selected.length === 0}>
        {saved ? <><CheckCircle size={18} /> Saved!</> : saving ? 'Saving…' : <><Save size={18} /> Save for {selected.length} Athlete{selected.length !== 1 ? 's' : ''}</>}
      </button>
    </div>
  )
}