import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { Trophy, Mail, Lock, Eye, EyeOff, UserPlus, LogIn, KeyRound } from 'lucide-react'
type Mode = 'login' | 'signup' | 'reset'
export default function Login() {
  const { user, loading, signIn } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  if (!loading && user) return <Navigate to='/dashboard' replace />
  const clearMessages = () => { setError(''); setSuccess('') }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); clearMessages(); setBusy(true)
    try {
      if (mode === 'login') { await signInWithEmailAndPassword(auth, email, password) }
      else if (mode === 'signup') {
        if (password !== confirm) { setError('Passwords do not match.'); setBusy(false); return }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); setBusy(false); return }
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await sendPasswordResetEmail(auth, email)
        setSuccess('Reset email sent! Check your inbox.')
      }
    } catch (err: unknown) {
      const code = (err as any)?.code
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential')
        setError('Invalid email or password.')
      else if (code === 'auth/email-already-in-use') setError('An account with this email already exists.')
      else if (code === 'auth/invalid-email') setError('Invalid email address.')
      else if (code === 'auth/too-many-requests') setError('Too many attempts. Try again later.')
      else setError('Something went wrong. Please try again.')
    }
    setBusy(false)
  }
  return (
    <div className='min-h-screen bg-gradient-to-br from-brand-900 to-brand-600 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm'>
        <div className='flex justify-center mb-4'><div className='bg-brand-600 text-white p-3 rounded-xl'><Trophy size={32} /></div></div>
        <h1 className='text-2xl font-bold text-gray-900 text-center mb-1'>TrackPerf</h1>
        <p className='text-gray-500 text-sm text-center mb-6'>Runner Performance Tracker</p>
        <h2 className='text-lg font-semibold text-gray-800 text-center mb-4'>
          {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </h2>
        {error   && <div className='bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4'>{error}</div>}
        {success && <div className='bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2 mb-4'>{success}</div>}
        <form onSubmit={handleSubmit} className='space-y-3'>
          <div className='relative'>
            <Mail size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
            <input type='email' required placeholder='Email address' className='input pl-9' value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          {mode !== 'reset' && (
            <div className='relative'>
              <Lock size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
              <input type={showPw ? 'text' : 'password'} required placeholder='Password' className='input pl-9 pr-9' value={password} onChange={e => setPassword(e.target.value)} />
              <button type='button' onClick={() => setShowPw(!showPw)} className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          )}
          {mode === 'signup' && (
            <div className='relative'>
              <Lock size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
              <input type={showPw ? 'text' : 'password'} required placeholder='Confirm password' className='input pl-9' value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
          )}
          <button type='submit' disabled={busy} className='btn-primary w-full flex items-center justify-center gap-2'>
            {busy ? <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> :
              mode === 'login'  ? <><LogIn size={16} /> Sign In</> :
              mode === 'signup' ? <><UserPlus size={16} /> Create Account</> :
                                  <><KeyRound size={16} /> Send Reset Email</>}
          </button>
        </form>
        <div className='mt-4 text-xs text-center space-y-1 text-gray-500'>
          {mode !== 'login'  && <button onClick={() => { setMode('login');  clearMessages() }} className='text-brand-600 hover:underline block w-full'>Already have an account? Sign in</button>}
          {mode !== 'signup' && <button onClick={() => { setMode('signup'); clearMessages() }} className='text-brand-600 hover:underline block w-full'>Don't have an account? Sign up</button>}
          {mode !== 'reset'  && <button onClick={() => { setMode('reset');  clearMessages() }} className='text-gray-400 hover:text-gray-600 hover:underline block w-full'>Forgot password?</button>}
        </div>
        <div className='flex items-center gap-3 my-4'><div className='flex-1 h-px bg-gray-200'/><span className='text-xs text-gray-400'>or</span><div className='flex-1 h-px bg-gray-200'/></div>
        <button onClick={() => { clearMessages(); signIn() }} className='w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors'>
          <svg className='w-5 h-5' viewBox='0 0 24 24'>
            <path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/>
            <path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/>
            <path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z'/>
            <path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  )
}