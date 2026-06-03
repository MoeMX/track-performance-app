import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  getDoc, query, where, orderBy, limit, Timestamp,
  onSnapshot, writeBatch, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import type { Athlete, TimeRecord, PersonalBest, TimingSession, EventType, Split } from '../types'

const col = {
  athletes: () => collection(db, 'athletes'),
  times:    () => collection(db, 'times'),
  pbs:      () => collection(db, 'personalBests'),
  sessions: () => collection(db, 'sessions'),
  users:    () => collection(db, 'users'),
}

export async function createAthlete(teamId: string, data: Omit<Athlete, 'id' | 'createdAt' | 'teamId'>) {
  return addDoc(col.athletes(), { ...data, teamId, active: true, createdAt: serverTimestamp() })
}
export async function updateAthlete(id: string, data: Partial<Athlete>) {
  return updateDoc(doc(db, 'athletes', id), data)
}
export async function deleteAthlete(id: string) {
  return updateDoc(doc(db, 'athletes', id), { active: false })
}
export function subscribeAthletes(teamId: string, cb: (a: Athlete[]) => void) {
  const q = query(col.athletes(), where('teamId', '==', teamId), where('active', '==', true), orderBy('name'))
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Athlete))))
}
export async function getAthlete(id: string): Promise<Athlete | null> {
  const snap = await getDoc(doc(db, 'athletes', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } as Athlete : null
}

export async function saveTime(data: {
  athleteId: string; teamId: string; event: EventType; timeMs: number;
  splits: Split[]; sessionId?: string; date?: Date; manualEntry?: boolean; notes?: string;
}) {
  const { athleteId, teamId, event, timeMs, splits, sessionId, date, manualEntry, notes } = data
  const timeRef = await addDoc(col.times(), {
    athleteId, teamId, event, timeMs, splits: splits ?? [],
    sessionId: sessionId ?? null,
    date: date ? Timestamp.fromDate(date) : serverTimestamp(),
    manualEntry: manualEntry ?? false,
    notes: notes ?? '',
    isPersonalBest: false,
    createdAt: serverTimestamp(),
  })
  await checkAndUpdatePB(athleteId, teamId, event, timeMs, timeRef.id, date ?? new Date())
  return timeRef
}

async function checkAndUpdatePB(athleteId: string, teamId: string, event: EventType, timeMs: number, timeId: string, date: Date) {
  const pbQuery = query(col.pbs(), where('athleteId', '==', athleteId), where('event', '==', event), limit(1))
  const pbSnap  = await getDocs(pbQuery)
  const batch   = writeBatch(db)
  if (pbSnap.empty || pbSnap.docs[0].data().timeMs > timeMs) {
    const pbRef = pbSnap.empty ? doc(col.pbs()) : pbSnap.docs[0].ref
    batch.set(pbRef, { athleteId, teamId, event, timeMs, timeId, date: Timestamp.fromDate(date), updatedAt: serverTimestamp() })
    batch.update(doc(db, 'times', timeId), { isPersonalBest: true })
    await batch.commit()
  }
}

export async function getAthleteTimesForEvent(athleteId: string, event: EventType, maxRecords = 50): Promise<TimeRecord[]> {
  const q = query(col.times(), where('athleteId', '==', athleteId), where('event', '==', event), orderBy('date', 'desc'), limit(maxRecords))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TimeRecord))
}
export async function getAthleteAllTimes(athleteId: string, maxRecords = 200): Promise<TimeRecord[]> {
  const q = query(col.times(), where('athleteId', '==', athleteId), orderBy('date', 'desc'), limit(maxRecords))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TimeRecord))
}
export async function getTeamTimes(teamId: string, since: Date): Promise<TimeRecord[]> {
  const q = query(col.times(), where('teamId', '==', teamId), where('date', '>=', Timestamp.fromDate(since)), orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TimeRecord))
}
export async function deleteTime(id: string) { return deleteDoc(doc(db, 'times', id)) }
export async function getAthletePBs(athleteId: string): Promise<PersonalBest[]> {
  const q = query(col.pbs(), where('athleteId', '==', athleteId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PersonalBest))
}
export function subscribePBs(athleteId: string, cb: (pbs: PersonalBest[]) => void) {
  const q = query(col.pbs(), where('athleteId', '==', athleteId))
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as PersonalBest))))
}
export async function createSession(data: Omit<TimingSession, 'id' | 'createdAt'>) {
  return addDoc(col.sessions(), { ...data, createdAt: serverTimestamp() })
}
export async function upsertUser(uid: string, data: { email: string; displayName: string; photoURL?: string }) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await addDoc(collection(db, 'users'), { uid, ...data, role: 'coach', createdAt: serverTimestamp() })
  }
}
export async function getOrCreateTeam(uid: string): Promise<string> {
  const userRef = doc(db, 'users', uid)
  const userSnap = await getDoc(userRef)
  if (userSnap.exists() && userSnap.data().teamId) return userSnap.data().teamId as string
  const teamRef = await addDoc(collection(db, 'teams'), { coachIds: [uid], createdAt: serverTimestamp() })
  await updateDoc(userRef, { teamId: teamRef.id })
  return teamRef.id
}