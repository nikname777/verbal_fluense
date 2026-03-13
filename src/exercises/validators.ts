import { CATEGORIES } from './categories'
import type { WordStatus } from './types'

export function checkFirstLetter(word: string, letter: string): boolean {
  const w = word.trim().toLowerCase()
  const l = letter.trim().toLowerCase()
  return w.startsWith(l)
}

export function checkDuplicate(word: string, previousWords: string[]): boolean {
  const w = word.trim().toLowerCase()
  return previousWords.map(p => p.trim().toLowerCase()).includes(w)
}

export function checkCategory(word: string, category: string): 'valid' | 'pending' {
  const w = word.trim().toLowerCase()
  const dict = CATEGORIES[category] ?? []
  return dict.includes(w) ? 'valid' : 'pending'
}

export function checkPhoneticCluster(word: string, previousWord: string): boolean {
  const w = word.trim().toLowerCase()
  const p = previousWord.trim().toLowerCase()
  if (w.length < 2 || p.length < 2) return false
  return w.slice(0, 2) === p.slice(0, 2)
}

export function validateSemanticWord(
  word: string,
  category: string,
  previousWords: string[]
): { status: WordStatus; errorReason?: string } {
  const text = word.trim().toLowerCase()
  if (!text) return { status: 'error', errorReason: 'Пустое слово' }

  if (checkDuplicate(text, previousWords)) {
    return { status: 'error', errorReason: 'Повтор' }
  }

  const categoryStatus = checkCategory(text, category)
  return { status: categoryStatus }
}

export function validatePhoneticWord(
  word: string,
  letter: string,
  previousWords: string[]
): { status: WordStatus; errorReason?: string } {
  const text = word.trim().toLowerCase()
  if (!text) return { status: 'error', errorReason: 'Пустое слово' }

  if (checkDuplicate(text, previousWords)) {
    return { status: 'error', errorReason: 'Повтор' }
  }

  if (!checkFirstLetter(text, letter)) {
    return { status: 'error', errorReason: `Не начинается на «${letter.toUpperCase()}»` }
  }

  return { status: 'valid' }
}
