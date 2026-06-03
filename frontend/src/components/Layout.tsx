import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, Users, Timer, PenLine, BarChart2, FileText, LogOut, Menu, X, Trophy } from 'lucide-react'
const NAV = [
  { to: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/athletes',  label: 'Athletes',     icon: Users },
  { to: '/timing',    label: 'Live Timing',  icon: Timer },
  { to: '/entry',     label: 'Manual Entry', icon: PenLine },
  { to: '/compare',   label: 'Compare',      icon: BarChart2 },
  { to: '/reports',   label: 'Reports',      icon: FileText },
]
export default function Layout() {
  const { user, signOut } = useAuth()
  const [open, setOpen]   = useState(false)
  const navigate          = useNavigate()
  const handleSignOut = async () => { await signOut(); navigate('/login') }
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <header className="md:hidden flex items-center justify-between bg-brand-700 text-white px-4 py-3">
        <div className="flex items-center gap-2 font-bold text-lg"><Trophy size={20} /> TrackPerf</div>
        <button onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
      </header>
      <nav className={`fixed inset-y-0 left-0 z-40 w-56 bg-brand-900 text-white flex flex-col transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="hidden md:flex items-center gap-2 px-5 py-5 font-bold text-xl border-b border-brand-700">
          <Trophy size={22} /> TrackPerf
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-brand-700 text-white' : 'text-blue-100 hover:bg-brand-800'}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </div>
        <div className="border-t border-brand-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            {user?.photoURL && <img src={user.photoURL} className="w-8 h-8 rounded-full" alt="" />}
            <div className="text-xs text-blue-200 truncate">{user?.displayName}</div>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-xs text-blue-200 hover:text-white transition-colors">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </nav>
      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}
      <main className="flex-1 overflow-auto p-4 md:p-6"><Outlet /></main>
    </div>
  )
}