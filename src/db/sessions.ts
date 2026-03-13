import db, { type Session } from './index'

export async function saveSession(session: Omit<Session, 'id'>): Promise<number> {
  return await db.sessions.add(session)
}

export async function getRecentSessions(exerciseId?: string, limit = 10): Promise<Session[]> {
  const query = db.sessions.orderBy('date').reverse()
  if (exerciseId) {
    return await query.filter(s => s.exerciseId === exerciseId).limit(limit).toArray()
  }
  return await query.limit(limit).toArray()
}

export async function getAllSessions(): Promise<Session[]> {
  return await db.sessions.orderBy('date').reverse().toArray()
}

export async function getTodaySessions(): Promise<Session[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const all = await db.sessions.orderBy('date').reverse().toArray()
  return all.filter(s => new Date(s.date) >= today)
}

// ─── Subcategory helpers ────────────────────────────────────────────────────

export function getSubcategoryKey(session: Session): string {
  const p = session.params as Record<string, unknown>
  if (session.exerciseId === 'semantic') return String(p.category ?? '')
  if (session.exerciseId === 'phonetic') return String(p.letter ?? '')
  return ''
}

export function getSubcategoryLabel(exerciseId: string, key: string): string {
  if (exerciseId === 'semantic') return key || 'Неизвестно'
  if (exerciseId === 'phonetic') return key ? `Буква ${key}` : 'Неизвестно'
  return 'Пикнейминг'
}

export async function getPrevScoreForSubcategory(
  exerciseId: string,
  subcategoryKey: string
): Promise<number | undefined> {
  const sessions = await getRecentSessions(exerciseId, 100)
  const filtered = sessions.filter(s => getSubcategoryKey(s) === subcategoryKey)
  return filtered[0]?.score
}

// ─── Grouped history ─────────────────────────────────────────────────────────

export interface SubcategoryGroup {
  exerciseId: string
  key: string
  label: string
  scores: number[]       // oldest → newest (last 5)
  mostRecentDate: Date
}

export async function getGroupedHistory(): Promise<SubcategoryGroup[]> {
  const sessions = await getAllSessions() // newest first

  // Build map keyed by "exerciseId:subcategoryKey"
  const map = new Map<string, { scores: number[]; mostRecentDate: Date }>()

  // Reverse to process oldest first so scores[] will be oldest→newest
  const oldest = [...sessions].reverse()
  oldest.forEach(s => {
    const subKey = getSubcategoryKey(s)
    const mapKey = `${s.exerciseId}::${subKey}`
    if (!map.has(mapKey)) {
      map.set(mapKey, { scores: [], mostRecentDate: new Date(s.date) })
    }
    const entry = map.get(mapKey)!
    entry.scores.push(s.score)
    entry.mostRecentDate = new Date(s.date)
  })

  return Array.from(map.entries())
    .map(([mapKey, entry]) => {
      const [exerciseId, subKey] = mapKey.split('::') as [string, string]
      return {
        exerciseId,
        key: subKey,
        label: getSubcategoryLabel(exerciseId, subKey),
        scores: entry.scores.slice(-5), // last 5
        mostRecentDate: entry.mostRecentDate,
      }
    })
    .sort((a, b) => b.mostRecentDate.getTime() - a.mostRecentDate.getTime())
}

// ─── Skills map data ──────────────────────────────────────────────────────────

export interface SkillData {
  exerciseId: string
  key: string
  label: string
  lastScore: number | null   // null = never trained
  sessionCount: number
}

export async function getSkillsMapData(): Promise<SkillData[]> {
  const sessions = await getAllSessions()

  const map = new Map<string, { lastScore: number; count: number }>()
  // Sessions are newest-first, so the first we see for a key is the most recent
  sessions.forEach(s => {
    const subKey = getSubcategoryKey(s)
    const mapKey = `${s.exerciseId}::${subKey}`
    if (!map.has(mapKey)) {
      map.set(mapKey, { lastScore: s.score, count: 0 })
    }
    map.get(mapKey)!.count++
  })

  return Array.from(map.entries()).map(([mapKey, data]) => {
    const [exerciseId, key] = mapKey.split('::') as [string, string]
    return {
      exerciseId,
      key,
      label: getSubcategoryLabel(exerciseId, key),
      lastScore: data.lastScore,
      sessionCount: data.count,
    }
  })
}
