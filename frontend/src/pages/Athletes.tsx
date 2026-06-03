import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { subscribeAthletes, createAthlete, updateAthlete, deleteAthlete } from '../lib/firestore'
import type { Athlete, EventType } from '../types'
import { ALL_EVENTS } from '../types'
import { Plus, Pencil, Trash2, ChevronRight, X } from 'lucide-react'

export default function Athletes() {
  const { teamId } = useAuth()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Athlete | null>(null)
  useEffect(() => { if (!teamId) return; return subscribeAthletes(teamId, setAthletes) }, [teamId])
  const handleSave = async (data: { name: string; events: EventType[]; dateOfBirth: string; notes: string }) => {
    if (!teamId) return
    editing ? await updateAthlete(editing.id, data) : await createAthlete(teamId, { ...data, active: true })
    setShowForm(false); setEditing(null)
  }
  const handleDelete = async (a: Athlete) => {
    if (confirm(`Remove ${a.name}?`)) await deleteAthlete(a.id)
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Athletes</h1><p className="text-gray-500 text-sm mt-1">{athletes.length} active</p></div>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={16} /> Add Athlete</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {athletes.map(a => (
          <div key={a.id} className="card flex items-center gap-4">
            <Link to={`/athletes/${a.id}`} className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate">{a.name}</div>
              <div className="text-xs text-gray-500 mt-0.5 truncate">{a.events.slice(0, 3).join(' · ')}{a.events.length > 3 ? ` +${a.events.length - 3}` : ''}</div>
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => { setEditing(a); setShowForm(true) }} className="p-1.5 text-gray-400 hover:text-brand-600"><Pencil size={15} /></button>
              <button onClick={() => handleDelete(a)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
              <Link to={`/athletes/${a.id}`} className="p-1.5 text-gray-400 hover:text-brand-600"><ChevronRight size={15} /></Link>
            </div>
          </div>
        ))}
      </div>
      {(showForm || editing) && (
        <AthleteForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null) }} />
      )}
    </div>
  )
}

function AthleteForm({ initial, onSave, onCancel }: { initial: Athlete | null; onSave: (d: any) => Promise<void>; onCancel: () => void }) {
  const [name, setName]     = useState(initial?.name ?? '')
  const [events, setEvents] = useState<EventType[]>(initial?.events ?? [])
  const [dob, setDob]       = useState(initial?.dateOfBirth ?? '')
  const [notes, setNotes]   = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const toggleEvent = (e: EventType) => setEvents(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])
  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault(); if (!name.trim()) return
    setSaving(true); await onSave({ name: name.trim(), events, dateOfBirth: dob, notes }); setSaving(false)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between mb-2"><h2 className="text-lg font-semibold">{initial ? 'Edit' : 'New'} Athlete</h2><button type="button" onClick={onCancel}><X size={20} className="text-gray-400" /></button></div>
        <div><label className="text-sm font-medium text-gray-700 block mb-1">Name *</label><input className="input" value={name} onChange={e => setName(e.target.value)} required autoFocus /></div>
        <div><label className="text-sm font-medium text-gray-700 block mb-1">Date of Birth</label><input type="date" className="input" value={dob} onChange={e => setDob(e.target.value)} /></div>
        <div><label className="text-sm font-medium text-gray-700 block mb-2">Events</label>
          <div className="flex flex-wrap gap-2">{ALL_EVENTS.map(ev => (
            <button key={ev} type="button" onClick={() => toggleEvent(ev)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${events.includes(ev) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'}`}>{ev}</button>
          ))}</div>
        </div>
        <div><label className="text-sm font-medium text-gray-700 block mb-1">Notes</label><textarea className="input resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} /></div>
        <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save' : 'Add'}</button></div>
      </form>
    </div>
  )
}