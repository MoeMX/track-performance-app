import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { subDays } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { subscribeAthletes, getTeamTimes, getAthletePBs } from '../lib/firestore'
import type { Athlete, TimeRecord, AthleteProgress } from '../types'
import { formatTime } from '../types'
import { TrendingUp, TrendingDown, Minus, Star, ChevronRight, AlertCircle } from 'lucide-react'

export default function Dashboard() {
  const { teamId } = useAuth()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [progress, setProgress] = useState<AthleteProgress[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!teamId) return
    const unsub = subscribeAthletes(teamId, async (aths) => {
      setAthletes(aths)
      const since = subDays(new Date(), 14)
      const times = await getTeamTimes(teamId, since)
      const prog: AthleteProgress[] = await Promise.all(aths.map(async (a) => {
        const athTimes = times.filter(t => t.athleteId === a.id).sort((x, y) => y.date.toMillis() - x.date.toMillis())
        const latest   = athTimes[0]
        const previous = latest ? athTimes.find(t => t.event === latest.event && t.id !== latest.id) : undefined
        const pbs      = await getAthletePBs(a.id)
        const pb       = pbs.find(p => latest && p.event === latest.event)
        let trend: AthleteProgress['trend'] = 'no_data'
        let deltaMs: number | undefined; let deltaPct: number | undefined
        if (latest && previous) {
          deltaMs  = latest.timeMs - previous.timeMs
          deltaPct = (deltaMs / previous.timeMs) * 100
          trend    = deltaMs < 0 ? 'improved' : deltaMs > 0 ? 'regressed' : 'same'
        }
        return { athlete: a, latestTime: latest, previousTime: previous, personalBest: pb, deltaMs, deltaPct, trend }
      }))
      setProgress(prog); setLoading(false)
    })
    return unsub
  }, [teamId])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  const improved  = progress.filter(p => p.trend === 'improved')
  const regressed = progress.filter(p => p.trend === 'regressed')
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Dashboard</h1><p className="text-gray-500 text-sm mt-1">Performance overview — last 14 days</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[['Athletes', athletes.length, 'blue'],['Improved', improved.length, 'green'],['Regressed', regressed.length, 'red']].map(([l, v, c]) => (
          <div key={l as string} className={`rounded-xl p-4 ${c === 'blue' ? 'bg-blue-50 text-blue-700' : c === 'green' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <div className="text-3xl font-bold">{v as number}</div><div className="text-sm font-medium mt-1">{l as string}</div>
          </div>
        ))}
      </div>
      {athletes.length === 0 && <div className="card flex items-center gap-3 text-gray-500"><AlertCircle size={20} /><span>No athletes yet. <Link to="/athletes" className="text-brand-600 font-medium">Add your first athlete.</Link></span></div>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {progress.map(p => (
          <Link key={p.athlete.id} to={`/athletes/${p.athlete.id}`}>
            <div className="card hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div><div className="font-semibold text-gray-900">{p.athlete.name}</div>{p.latestTime && <div className="text-xs text-gray-500 mt-0.5">{p.latestTime.event}</div>}</div>
                {p.trend === 'improved' && <TrendingUp size={20} className="text-green-500" />}
                {p.trend === 'regressed' && <TrendingDown size={20} className="text-red-500" />}
                {p.trend === 'same' && <Minus size={20} className="text-gray-400" />}
              </div>
              {p.latestTime ? (
                <>
                  <div className="text-2xl font-mono font-bold text-gray-900">{formatTime(p.latestTime.timeMs)}{p.latestTime.isPersonalBest && <span className="ml-2 badge-pb text-xs"><Star size={10} /> PB</span>}</div>
                  {p.deltaMs !== undefined && <div className={`text-xs mt-1 font-medium ${p.trend === 'improved' ? 'text-green-600' : p.trend === 'regressed' ? 'text-red-600' : 'text-gray-500'}`}>{p.deltaMs > 0 ? '+' : ''}{formatTime(Math.abs(p.deltaMs))} ({p.deltaPct!.toFixed(1)}%) vs prev</div>}
                  {p.personalBest && <div className="text-xs text-gray-400 mt-1">PB: {formatTime(p.personalBest.timeMs)}</div>}
                </>
              ) : <div className="text-sm text-gray-400">No recent times</div>}
              <div className="flex justify-end mt-3"><ChevronRight size={16} className="text-gray-400" /></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}