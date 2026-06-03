import React, { useEffect, useState } from 'react'
import { subDays, subMonths, startOfYear } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { subscribeAthletes, getAthleteTimesForEvent } from '../lib/firestore'
import type { Athlete, EventType, TimeRecord, ComparisonPeriod } from '../types'
import { TIMED_EVENTS, formatTime } from '../types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
const PERIODS: { label: string; value: ComparisonPeriod }[] = [
  { label: 'vs Last Week', value: 'last_week' }, { label: 'vs Last Month', value: 'last_month' },
  { label: 'vs Season', value: 'season' }, { label: 'vs All Time', value: 'all_time' },
]
function periodStart(p: ComparisonPeriod): Date {
  const now = new Date()
  switch (p) {
    case 'last_week':  return subDays(now, 7)
    case 'last_month': return subMonths(now, 1)
    case 'season':     return startOfYear(now)
    case 'all_time':   return new Date(0)
  }
}
export default function Comparison() {
  const { teamId } = useAuth()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [event, setEvent]       = useState<EventType>('100m')
  const [period, setPeriod]     = useState<ComparisonPeriod>('last_week')
  const [rows, setRows]         = useState<{ athlete: Athlete; current?: TimeRecord; baseline?: TimeRecord }[]>([])
  const [loading, setLoading]   = useState(false)
  useEffect(() => { if (!teamId) return; return subscribeAthletes(teamId, setAthletes) }, [teamId])
  useEffect(() => {
    if (athletes.length === 0) return; setLoading(true)
    const since = periodStart(period)
    Promise.all(athletes.map(async a => {
      const times  = await getAthleteTimesForEvent(a.id, event, 100)
      const sorted = [...times].sort((x, y) => y.date.toMillis() - x.date.toMillis())
      return { athlete: a, current: sorted[0], baseline: sorted.find(t => t.date.toDate() < since) }
    })).then(r => { setRows(r); setLoading(false) })
  }, [athletes, event, period])
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Comparison</h1></div>
      <div className="flex flex-wrap gap-3">
        <select className="input w-auto" value={event} onChange={e => setEvent(e.target.value as EventType)}>{TIMED_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}</select>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">{PERIODS.map(p => <button key={p.value} onClick={() => setPeriod(p.value)} className={`text-xs px-3 py-2 font-medium transition-colors ${period === p.value ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{p.label}</button>)}</div>
      </div>
      {loading ? <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b text-xs text-gray-500 uppercase"><th className="text-left py-2 pr-4">Athlete</th><th className="text-left py-2 pr-4">Current</th><th className="text-left py-2 pr-4">Baseline</th><th className="text-left py-2 pr-4">Δ sec</th><th className="text-left py-2 pr-4">Δ %</th><th>Trend</th></tr></thead>
            <tbody>{rows.map(({ athlete, current, baseline }) => {
              const delta = current && baseline ? current.timeMs - baseline.timeMs : undefined
              const pct   = delta !== undefined && baseline ? (delta / baseline.timeMs) * 100 : undefined
              const trend = delta === undefined ? 'none' : delta < 0 ? 'improved' : delta > 0 ? 'regressed' : 'same'
              return <tr key={athlete.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 pr-4 font-medium">{athlete.name}</td>
                <td className="py-3 pr-4 font-mono">{current ? formatTime(current.timeMs) : '—'}</td>
                <td className="py-3 pr-4 font-mono text-gray-500">{baseline ? formatTime(baseline.timeMs) : '—'}</td>
                <td className={`py-3 pr-4 font-mono font-semibold ${trend === 'improved' ? 'text-green-600' : trend === 'regressed' ? 'text-red-600' : 'text-gray-400'}`}>{delta !== undefined ? `${delta > 0 ? '+' : ''}${formatTime(Math.abs(delta))}` : '—'}</td>
                <td className={`py-3 pr-4 font-semibold ${trend === 'improved' ? 'text-green-600' : trend === 'regressed' ? 'text-red-600' : 'text-gray-400'}`}>{pct !== undefined ? `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%` : '—'}</td>
                <td className="py-3">{trend === 'improved' && <TrendingUp size={16} className="text-green-500" />}{trend === 'regressed' && <TrendingDown size={16} className="text-red-500" />}{trend === 'same' && <Minus size={16} className="text-gray-400" />}</td>
              </tr>
            })}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}