export type ExerciseType = 'semantic' | 'phonetic' | 'picnaming'

export type WordStatus = 'valid' | 'pending' | 'error'

export interface WordResult {
  text: string
  timestamp: number
  status: WordStatus
  errorReason?: string
}

export interface ExerciseParams {
  // Semantic
  category?: string
  // Phonetic
  letter?: string
  // Shared
  duration?: number
  bpmEnabled?: boolean
  bpm?: number
  // PicNaming
  speed?: number
  imageCount?: number
}

export interface ExerciseDefinition {
  id: string
  type: ExerciseType
  title: string
  subtitle: string
  description: string
  level: string
  icon: string
}

export const EXERCISES: ExerciseDefinition[] = [
  {
    id: 'semantic',
    type: 'semantic',
    title: 'Семантическая беглость',
    subtitle: 'Упражнение №1',
    description: 'Называй слова из заданной категории как можно быстрее',
    level: 'Базовый',
    icon: '🧠',
  },
  {
    id: 'phonetic',
    type: 'phonetic',
    title: 'Фонетическая беглость',
    subtitle: 'Упражнение №2А',
    description: 'Называй слова, начинающиеся на заданную букву',
    level: 'Базовый',
    icon: '🔤',
  },
  {
    id: 'picnaming',
    type: 'picnaming',
    title: 'Пикнейминг',
    subtitle: 'Упражнение №3',
    description: 'Называй картинки как можно быстрее',
    level: 'Базовый',
    icon: '🖼️',
  },
]
