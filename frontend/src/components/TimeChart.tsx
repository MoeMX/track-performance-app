import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format } from 'date-fns'
import type { TimeRecord } from '../types'
import { formatTime } from '../types'
interface Props { times: TimeRecord[]; pbMs?: number }
export default function TimeChart({ times, pbMs }: Props) {
  const data = [...times].sort((a, b) => a.date.toMillis() - b.date.toMillis())
    .map(t => ({ date: format(t.date.toDate(), 'MMM d'), ms: t.timeMs }))
  const minMs = Math.min(...data.map(d => d.ms)) * 0.995
  const maxMs = Math.max(...data.map(d => d.ms)) * 1.005
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[minMs, maxMs]} tickFormatter={v => formatTime(v)} tick={{ fontSize: 11 }} width={52} />
        <Tooltip formatter={(v: number) => [formatTime(v), 'Time']} contentStyle={{ fontSize: 12 }} />
        {pbMs && <ReferenceLine y={pbMs} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'PB', fill: '#f59e0b', fontSize: 11 }} />}
        <Line type="monotone" dataKey="ms" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}