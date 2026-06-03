import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { getAthlete, getAthleteAllTimes, getAthletePBs, deleteTime } from '../lib/firestore'
import type { Athlete, TimeRecord, PersonalBest, EventType } from '../types'
import { formatTime } from '../types'
import { Star, Trash2, ArrowLeft } from 'lucide-react'
import TimeChart from '../components/TimeChart'

export default function AthleteProfile() {
  const { id } = useParams<{ id: string }>()
  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [times, setTimes]     = useState<TimeRecord[]>([])
  const [pbs, setPbs]         = useState<PersonalBest[]>([])
  const [event, setEvent]     = useState<EventType | 'all'>('all')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!id) return
    Promise.all([getAthlete(id), getAthleteAllTimes(id), getAthletePBs(id)])
      .then(([a, t, p]) => { setAthlete(a); setTimes(t); setPbs(p); setLoading(false) })
  }, [id])
  const filtered   = event === 'all' ? times : times.filter(t => t.event === event)
  const chartTimes = filtered.slice(0, 20)
  const pb         = event !== 'all' ? pbs.find(p => p.event === event) : undefined
  const handleDelete = async (t: TimeRecord) => {
    if (confirm('Delete this time?')) { await deleteTime(t.id); setTimes(prev => prev.filter(x => x.id !== t.id)) }
  }
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!athlete) return <div className="card text-gray-500">Athlete not found.</div>
  const usedEvents = [...new Set(times.map(t => t.event))] as EventType[]
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/athletes" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18} /></Link>
        <div><h1 className="text-2xl font-bold text-gray-900">{athlete.name}</h1><p className="text-gray-500 text-sm">{athlete.events.join(' · ')}</p></div>
      </div>
      {pbs.length > 0 && <div><h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Personal Bests</h2><div className="flex flex-wrap gap-3">{pbs.map(pb => <div key={pb.id} className="card flex items-center gap-2 py-2"><Star size={14} className="text-yellow-400" /><div><div className="text-xs text-gray-500">{pb.event}</div><div className="font-mono font-bold text-gray-900">{formatTime(pb.timeMs)}</div></div></div>)}</div></div>}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setEvent('all')} className={`text-xs px-3 py-1 rounded-full border ${event === 'all' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border-gray-300'}`}>All</button>
        {usedEvents.map(ev => <button key={ev} onClick={() => setEvent(ev)} className={`text-xs px-3 py-1 rounded-full border ${event === ev ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border-gray-300'}`}>{ev}</button>)}
      </div>
      {chartTimes.length > 1 && <div className="card"><h2 className="text-sm font-semibold text-gray-700 mb-3">Trend</h2><TimeChart times={chartTimes} pbMs={pb?.timeMs} /></div>}
      <div className="card overflow-x-auto">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">History</h2>
        {filtered.length === 0 ? <p className="text-gray-400 text-sm">No times yet.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-xs text-gray-500 uppercase"><th className="text-left py-2 pr-4">Date</th><th className="text-left py-2 pr-4">Event</th><th className="text-left py-2 pr-4">Time</th><th className="text-left py-2 pr-4">Notes</th><th /></tr></thead>
            <tbody>{filtered.map(t => (
              <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 pr-4 text-gray-600">{format(t.date.toDate(), 'MMM d, yyyy')}</td>
                <td className="py-2 pr-4">{t.event}</td>
                <td className="py-2 pr-4 font-mono font-semibold">{formatTime(t.timeMs)}{t.isPersonalBest && <span className="ml-1 badge-pb"><Star size={9} /> PB</span>}</td>
                <td className="py-2 pr-4 text-gray-500 text-xs max-w-xs truncate">{t.notes || '—'}</td>
                <td className="py-2"><button onClick={() => handleDelete(t)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}