import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthContext, useAuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login          from './pages/Login'
import Dashboard      from './pages/Dashboard'
import Athletes       from './pages/Athletes'
import AthleteProfile from './pages/AthleteProfile'
import TimingSession  from './pages/TimingSession'
import ManualEntry    from './pages/ManualEntry'
import Comparison     from './pages/Comparison'
import Reports        from './pages/Reports'

export default function App() {
  const auth = useAuthProvider()
  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"    element={<Dashboard />} />
            <Route path="athletes"     element={<Athletes />} />
            <Route path="athletes/:id" element={<AthleteProfile />} />
            <Route path="timing"       element={<TimingSession />} />
            <Route path="entry"        element={<ManualEntry />} />
            <Route path="compare"      element={<Comparison />} />
            <Route path="reports"      element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}