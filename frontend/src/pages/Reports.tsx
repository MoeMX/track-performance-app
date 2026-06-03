import React, { useEffect, useState } from 'react'
import { format, subDays, subMonths, startOfYear } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { subscribeAthletes, getTeamTimes, getAthletePBs } from '../lib/firestore'
import type { Athlete, TimeRecord } from '../types'
import { formatTime } from '../types'
import { Download, FileText } from 'lucide-react'
type Period = '7d' | '30d' | 'ytd' | 'all'
function since(p: Period): Date {
  switch (p) {
    case '7d':  return subDays(new Date(), 7)
    case '30d': return subMonths(new Date(), 1)
    case 'ytd': return startOfYear(new Date())
    case 'all': return new Date(0)
  }
}
export default function Reports() {
  const { teamId } = useAuth()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [times, setTimes]       = useState<TimeRecord[]>([])
  const [period, setPeriod]     = useState<Period>('30d')
  const [loading, setLoading]   = useState(false)
  useEffect(() => { if (!teamId) return; return subscribeAthletes(teamId, setAthletes) }, [teamId])
  useEffect(() => { if (!teamId) return; setLoading(true); getTeamTimes(teamId, since(period)).then(t => { setTimes(t); setLoading(false) }) }, [teamId, period])
  const exportCSV = (scope: 'team' | string) => {
    const filtered = scope === 'team' ? times : times.filter(t => t.athleteId === scope)
    const headers  = ['Date','Athlete','Event','Time','Personal Best','Manual','Notes']
    const rows     = filtered.map(t => {
      const ath = athletes.find(a => a.id === t.athleteId)
      return [format(t.date.toDate(),'yyyy-MM-dd'), ath?.name??'', t.event, formatTime(t.timeMs), t.isPersonalBest?'Yes':'No', t.manualEntry?'Yes':'No', t.notes??'']
        .map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')
    })
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `trackperf-${scope === 'team' ? 'team' : athletes.find(x=>x.id===scope)?.name??scope}-${format(new Date(),'yyyy-MM-dd')}.csv`
    a.click(); URL.revokeObjectURL(url)
  }
  const exportPDF = async (scope: 'team' | string) => {
    const { jsPDF }           = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const filtered = scope === 'team' ? times : times.filter(t => t.athleteId === scope)
    const doc = new jsPDF()
    doc.setFontSize(16); doc.text('TrackPerf Report', 14, 18)
    doc.setFontSize(10); doc.text(`Period: ${period} | Generated: ${format(new Date(),'MMMM d, yyyy')}`, 14, 26)
    autoTable(doc, { startY: 32, head: [['Date','Athlete','Event','Time','PB?']], body: filtered.map(t => [format(t.date.toDate(),'MMM d yyyy'), athletes.find(a=>a.id===t.athleteId)?.name??'', t.event, formatTime(t.timeMs), t.isPersonalBest?'★':'']), styles: { fontSize: 8 }, headStyles: { fillColor: [37,99,235] } })
    doc.save(`trackperf-${scope === 'team' ? 'team' : athletes.find(x=>x.id===scope)?.name??scope}.pdf`)
  }
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Reports</h1></div>
      <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
        {([['7d','7 days'],['30d','30 days'],['ytd','Season'],['all','All Time']] as [Period,string][]).map(([val,lbl]) => <button key={val} onClick={() => setPeriod(val)} className={`text-xs px-4 py-2 font-medium ${period===val?'bg-brand-600 text-white':'bg-white text-gray-600'}`}>{lbl}</button>)}
      </div>
      {loading ? <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"/></div> : (
        <div className="space-y-3">
          <div className="card flex items-center justify-between">
            <div className="flex items-center gap-3"><FileText size={20} className="text-brand-500"/><div><div className="font-semibold text-gray-900">Full Team Report</div><div className="text-xs text-gray-500">{times.length} times · {athletes.length} athletes</div></div></div>
            <div className="flex gap-2">
              <button className="btn-secondary flex items-center gap-2 text-sm py-1.5" onClick={() => exportCSV('team')}><Download size={14}/> CSV</button>
              <button className="btn-primary flex items-center gap-2 text-sm py-1.5" onClick={() => exportPDF('team')}><Download size={14}/> PDF</button>
            </div>
          </div>
          {athletes.map(a => { const count = times.filter(t => t.athleteId === a.id).length; return (
            <div key={a.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm">{a.name[0]}</div><div><div className="font-medium text-gray-900">{a.name}</div><div className="text-xs text-gray-500">{count} times</div></div></div>
              <div className="flex gap-2">
                <button className="btn-secondary flex items-center gap-2 text-sm py-1.5" onClick={() => exportCSV(a.id)}><Download size={14}/> CSV</button>
                <button className="btn-primary flex items-center gap-2 text-sm py-1.5" onClick={() => exportPDF(a.id)}><Download size={14}/> PDF</button>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  )
}