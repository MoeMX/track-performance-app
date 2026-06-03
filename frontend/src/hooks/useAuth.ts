import { useState, useEffect, createContext, useContext } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, User } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { upsertUser, getOrCreateTeam } from '../lib/firestore'

interface AuthCtx {
  user: User | null; teamId: string | null; loading: boolean;
  signIn: () => Promise<void>; signOut: () => Promise<void>;
}
export const AuthContext = createContext<AuthCtx>({
  user: null, teamId: null, loading: true,
  signIn: async () => {}, signOut: async () => {}
})
export function useAuth() { return useContext(AuthContext) }
export function useAuthProvider(): AuthCtx {
  const [user, setUser]     = useState<User | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        await upsertUser(u.uid, { email: u.email!, displayName: u.displayName!, photoURL: u.photoURL ?? undefined })
        const tid = await getOrCreateTeam(u.uid)
        setTeamId(tid)
      } else { setTeamId(null) }
      setLoading(false)
    })
  }, [])
  const signIn = async () => { await signInWithPopup(auth, googleProvider) }
  const signOut = async () => { await fbSignOut(auth) }
  return { user, teamId, loading, signIn, signOut }
}