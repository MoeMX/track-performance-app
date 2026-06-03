import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { subscribeAthletes, saveTime } from '../lib/firestore'
import type { Athlete, EventType } from '../types'
import { ALL_EVENTS, parseTime } from '../types'
import { Plus, Trash2, Save, CheckCircle } from 'lucide-react'
interface Entry { athleteId: string; event: EventType; timeStr: string; date: string; notes: string }
export default function ManualEntry() {
  const { teamId } = useAuth()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [entries, setEntries]   = useState<Entry[]>([{ athleteId: '', event: '100m', timeStr: '', date: new Date().toISOString().slice(0,10), notes: '' }])
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [errors, setErrors]     = useState<string[]>([])
  useEffect(() => { if (!teamId) return; return subscribeAthletes(teamId, setAthletes) }, [teamId])
  const update = (i: number, key: keyof Entry, val: string) => setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [key]: val } : e))
  const handleSave = async () => {
    if (!teamId) return
    const errs: string[] = []
    entries.forEach((e, i) => {
      if (!e.athleteId) errs.push(`Row ${i+1}: select athlete`)
      else if (!e.timeStr) errs.push(`Row ${i+1}: enter time`)
      else if (parseTime(e.timeStr) === null) errs.push(`Row ${i+1}: invalid time`)
    })
    if (errs.length) { setErrors(errs); return }
    setErrors([]); setSaving(true)
    await Promise.all(entries.map(e => saveTime({ athleteId: e.athleteId, teamId: teamId!, event: e.event, timeMs: parseTime(e.timeStr)!, splits: [], date: new Date(e.date), manualEntry: true, notes: e.notes })))
    setSaving(false); setSaved(true)
    setEntries([{ athleteId: '', event: '100m', timeStr: '', date: new Date().toISOString().slice(0,10), notes: '' }])
    setTimeout(() => setSaved(false), 3000)
  }
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Manual Entry</h1><p className="text-gray-500 text-sm mt-1">Format: <code className="bg-gray-100 px-1 rounded">SS.mmm</code> or <code className="bg-gray-100 px-1 rounded">M:SS.mmm</code></p></div>
      {errors.length > 0 && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{errors.map((e, i) => <div key={i}>{e}</div>)}</div>}
      <div className="space-y-3">{entries.map((entry, i) => (
        <div key={i} className="card grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
          <div className="sm:col-span-2"><label className="text-xs font-medium text-gray-600 block mb-1">Athlete</label><select className="input" value={entry.athleteId} onChange={e => update(i, 'athleteId', e.target.value)}><option value="">Select…</option>{athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Event</label><select className="input" value={entry.event} onChange={e => update(i, 'event', e.target.value as EventType)}>{ALL_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}</select></div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Time</label><input className="input font-mono" placeholder="10.45" value={entry.timeStr} onChange={e => update(i, 'timeStr', e.target.value)} /></div>
          <div><label className="text-xs font-medium text-gray-600 block mb-1">Date</label><input type="date" className="input" value={entry.date} onChange={e => update(i, 'date', e.target.value)} /></div>
          <div className="flex items-end gap-2"><div className="flex-1"><label className="text-xs font-medium text-gray-600 block mb-1">Notes</label><input className="input" value={entry.notes} onChange={e => update(i, 'notes', e.target.value)} /></div>{entries.length > 1 && <button onClick={() => setEntries(prev => prev.filter((_, idx) => idx !== i))} className="p-2 text-red-400 hover:text-red-600 mb-0.5"><Trash2 size={16} /></button>}</div>
        </div>
      ))}</div>
      <div className="flex gap-3">
        <button className="btn-secondary flex items-center gap-2" onClick={() => setEntries(prev => [...prev, { athleteId: '', event: '100m', timeStr: '', date: new Date().toISOString().slice(0,10), notes: '' }])}><Plus size={16} /> Add Row</button>
        <button className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={saving}>{saved ? <><CheckCircle size={16} /> Saved!</> : saving ? 'Saving…' : <><Save size={16} /> Save</>}</button>
      </div>
    </div>
  )
}