import { Timestamp } from 'firebase/firestore'

export type EventType =
  | '100m' | '200m' | '400m' | '800m' | '1500m' | '5000m' | '10000m'
  | '110m Hurdles' | '400m Hurdles' | '4x100m Relay' | '4x400m Relay'
  | 'Long Jump' | 'High Jump' | 'Triple Jump'
  | 'Shot Put' | 'Discus' | 'Javelin'

export const ALL_EVENTS: EventType[] = [
  '100m', '200m', '400m', '800m', '1500m', '5000m', '10000m',
  '110m Hurdles', '400m Hurdles',
  '4x100m Relay', '4x400m Relay',
  'Long Jump', 'High Jump', 'Triple Jump',
  'Shot Put', 'Discus', 'Javelin',
]

export const TIMED_EVENTS: EventType[] = [
  '100m', '200m', '400m', '800m', '1500m', '5000m', '10000m',
  '110m Hurdles', '400m Hurdles', '4x100m Relay', '4x400m Relay',
]

export interface Athlete {
  id: string
  name: string
  teamId: string
  events: EventType[]
  dateOfBirth?: string
  photoUrl?: string
  notes?: string
  active: boolean
  createdAt: Timestamp
}

export interface Split {
  label: string
  timeMs: number
}

export interface TimeRecord {
  id: string
  athleteId: string
  sessionId?: string
  teamId: string
  date: Timestamp
  event: EventType
  timeMs: number
  splits: Split[]
  isPersonalBest: boolean
  manualEntry: boolean
  notes?: string
  createdAt: Timestamp
}

export interface PersonalBest {
  id: string
  athleteId: string
  event: EventType
  timeMs: number
  timeId: string
  date: Timestamp
  updatedAt: Timestamp
}

export interface TimingSession {
  id: string
  teamId: string
  coachId: string
  date: Timestamp
  event: EventType
  location?: string
  notes?: string
  createdAt: Timestamp
}

export interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  teamId?: string
  role: 'coach' | 'admin'
}

export type ComparisonPeriod = 'last_week' | 'last_month' | 'season' | 'all_time'

export interface AthleteProgress {
  athlete: Athlete
  latestTime?: TimeRecord
  previousTime?: TimeRecord
  personalBest?: PersonalBest
  deltaMs?: number
  deltaPct?: number
  trend: 'improved' | 'regressed' | 'same' | 'no_data'
}

export function formatTime(ms: number): string {
  if (ms <= 0) return '0.000'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const millis  = Math.floor((ms % 1000))
  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
  }
  return `${seconds}.${String(millis).padStart(3, '0')}`
}

export function parseTime(str: string): number | null {
  str = str.trim()
  const parts = str.split(':')
  if (parts.length === 2) {
    const min = parseFloat(parts[0])
    const sec = parseFloat(parts[1])
    if (isNaN(min) || isNaN(sec)) return null
    return Math.round((min * 60 + sec) * 1000)
  }
  const sec = parseFloat(str)
  if (isNaN(sec)) return null
  return Math.round(sec * 1000)
}