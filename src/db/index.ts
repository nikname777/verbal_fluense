import Dexie, { type EntityTable } from 'dexie'

export interface Session {
  id?: number
  exerciseId: string
  date: Date
  duration: number
  params: Record<string, unknown>
  words: string[]
  validCount: number
  pendingCount: number
  errorCount: number
  confirmedCount: number
  score: number
  errors: Array<{ word: string; reason: string }>
}

export interface Setting {
  key: string
  value: unknown
}

const db = new Dexie('VerbalFluencyDB') as Dexie & {
  sessions: EntityTable<Session, 'id'>
  settings: EntityTable<Setting, 'key'>
}

db.version(1).stores({
  sessions: '++id, exerciseId, date, score',
  settings: 'key',
})

export default db
