export type VerdictLevel = 'critical' | 'low' | 'basic' | 'average' | 'good' | 'advanced' | 'master'

export interface Verdict {
  level: VerdictLevel
  score: number
  label: string
  color: string
  bgColor: string
  borderColor: string
  message: string
  benchmark: string
  delta?: {
    previous: number
    change: number
    percentChange: number
  }
}

interface ScaleEntry {
  max: number
  level: VerdictLevel
  label: string
  color: string
  bgColor: string
  borderColor: string
  message: string
}

function buildVerdict(
  score: number,
  scale: ScaleEntry[],
  benchmark: string,
  previousScore?: number
): Verdict {
  const entry = scale.find(e => score <= e.max) ?? scale[scale.length - 1]!

  const verdict: Verdict = {
    level: entry.level,
    score,
    label: entry.label,
    color: entry.color,
    bgColor: entry.bgColor,
    borderColor: entry.borderColor,
    message: entry.message,
    benchmark,
  }

  if (previousScore !== undefined) {
    const change = score - previousScore
    const percentChange = previousScore > 0
      ? Math.round(Math.abs(change / previousScore) * 100)
      : 0
    verdict.delta = { previous: previousScore, change, percentChange }
  }

  return verdict
}

const SEMANTIC_SCALE: ScaleEntry[] = [
  {
    max: 8, level: 'critical', label: 'Критический',
    color: 'text-red-400', bgColor: 'bg-red-950/60', borderColor: 'border-red-800/60',
    message: 'Критический уровень. Начните с медленного темпа, не спешите. Регулярные тренировки дадут результат.',
  },
  {
    max: 12, level: 'low', label: 'Ниже среднего',
    color: 'text-orange-400', bgColor: 'bg-orange-950/60', borderColor: 'border-orange-800/60',
    message: 'Ниже среднего. Есть куда расти. Тренируйтесь ежедневно по 3–5 минут.',
  },
  {
    max: 15, level: 'basic', label: 'Базовый',
    color: 'text-yellow-400', bgColor: 'bg-yellow-950/60', borderColor: 'border-yellow-800/60',
    message: 'Базовый уровень. Вы на правильном пути. Стремитесь к 20+.',
  },
  {
    max: 21, level: 'average', label: 'Средний',
    color: 'text-blue-400', bgColor: 'bg-blue-950/60', borderColor: 'border-blue-800/60',
    message: 'Хороший средний уровень. Продолжайте тренировки для выхода на продвинутый.',
  },
  {
    max: 30, level: 'good', label: 'Хороший',
    color: 'text-green-400', bgColor: 'bg-green-950/60', borderColor: 'border-green-800/60',
    message: 'Отличный результат! Ваша семантическая беглость выше среднего.',
  },
  {
    max: 40, level: 'advanced', label: 'Продвинутый',
    color: 'text-purple-400', bgColor: 'bg-purple-950/60', borderColor: 'border-purple-800/60',
    message: 'Продвинутый уровень! Переходите к более сложным упражнениям.',
  },
  {
    max: Infinity, level: 'master', label: 'Мастер',
    color: 'text-amber-400', bgColor: 'bg-amber-950/60', borderColor: 'border-amber-800/60',
    message: 'Уровень мастера. Исключительная речевая беглость!',
  },
]

const PHONETIC_SCALE: ScaleEntry[] = [
  {
    max: 6, level: 'critical', label: 'Критический',
    color: 'text-red-400', bgColor: 'bg-red-950/60', borderColor: 'border-red-800/60',
    message: 'Критический уровень. Фонетическая беглость требует серьёзной работы. Начните с простых букв (С, П, К).',
  },
  {
    max: 10, level: 'low', label: 'Ниже среднего',
    color: 'text-orange-400', bgColor: 'bg-orange-950/60', borderColor: 'border-orange-800/60',
    message: 'Ниже среднего. Практикуйте с разными буквами ежедневно.',
  },
  {
    max: 14, level: 'basic', label: 'Базовый',
    color: 'text-yellow-400', bgColor: 'bg-yellow-950/60', borderColor: 'border-yellow-800/60',
    message: 'Базовый уровень. Стремитесь к 15+. Попробуйте упражнение с парами букв.',
  },
  {
    max: 20, level: 'average', label: 'Средний',
    color: 'text-blue-400', bgColor: 'bg-blue-950/60', borderColor: 'border-blue-800/60',
    message: 'Хороший средний уровень фонетической беглости.',
  },
  {
    max: 28, level: 'good', label: 'Хороший',
    color: 'text-green-400', bgColor: 'bg-green-950/60', borderColor: 'border-green-800/60',
    message: 'Отличный результат! Фонетическая беглость развита хорошо.',
  },
  {
    max: 38, level: 'advanced', label: 'Продвинутый',
    color: 'text-purple-400', bgColor: 'bg-purple-950/60', borderColor: 'border-purple-800/60',
    message: 'Продвинутый уровень! Вы быстро оперируете звуковой структурой слов.',
  },
  {
    max: Infinity, level: 'master', label: 'Мастер',
    color: 'text-amber-400', bgColor: 'bg-amber-950/60', borderColor: 'border-amber-800/60',
    message: 'Уровень мастера. Выдающаяся фонетическая беглость!',
  },
]

export function getSemanticVerdict(score: number, previousScore?: number): Verdict {
  return buildVerdict(score, SEMANTIC_SCALE, 'Средний показатель взрослого человека: ~22 слова/мин', previousScore)
}

export function getPhoneticVerdict(score: number, previousScore?: number): Verdict {
  return buildVerdict(score, PHONETIC_SCALE, 'Средний показатель взрослого: ~15 слов/мин', previousScore)
}

export function getPicNamingVerdict(
  correctCount: number,
  totalPictures: number,
  previousCorrect?: number
): Verdict {
  const k = totalPictures / 30
  const scale: ScaleEntry[] = [
    {
      max: Math.round(10 * k), level: 'critical', label: 'Критический',
      color: 'text-red-400', bgColor: 'bg-red-950/60', borderColor: 'border-red-800/60',
      message: 'Критический уровень. Тренируйте сначала фонетическую беглость, потом возвращайтесь к пикнеймингу.',
    },
    {
      max: Math.round(16 * k), level: 'low', label: 'Ниже среднего',
      color: 'text-orange-400', bgColor: 'bg-orange-950/60', borderColor: 'border-orange-800/60',
      message: 'Ниже среднего. Увеличьте время показа картинки до 2–3 секунд и тренируйтесь.',
    },
    {
      max: Math.round(21 * k), level: 'basic', label: 'Базовый',
      color: 'text-yellow-400', bgColor: 'bg-yellow-950/60', borderColor: 'border-yellow-800/60',
      message: 'Базовый уровень. Постепенно уменьшайте время показа.',
    },
    {
      max: Math.round(25 * k), level: 'average', label: 'Средний',
      color: 'text-blue-400', bgColor: 'bg-blue-950/60', borderColor: 'border-blue-800/60',
      message: 'Хороший результат. Попробуйте ускорить показ до 1 секунды.',
    },
    {
      max: Math.round(28 * k), level: 'good', label: 'Хороший',
      color: 'text-green-400', bgColor: 'bg-green-950/60', borderColor: 'border-green-800/60',
      message: 'Отлично! Быстрое распознавание и называние.',
    },
    {
      max: Infinity, level: 'master', label: 'Мастер',
      color: 'text-amber-400', bgColor: 'bg-amber-950/60', borderColor: 'border-amber-800/60',
      message: 'Безупречно! Мгновенная реакция на каждую картинку.',
    },
  ]
  return buildVerdict(
    correctCount,
    scale,
    'Счёт ниже 17 говорит о необходимости активных тренировок',
    previousCorrect
  )
}

export function getCombinedVerdict(
  semantic?: number,
  phonetic?: number,
  picnaming?: { correct: number; total: number }
): { summary: string; weakest: string; recommendation: string } {
  const levelOrder: VerdictLevel[] = ['critical', 'low', 'basic', 'average', 'good', 'advanced', 'master']
  const parts: string[] = []
  const levels: Array<{ name: string; level: VerdictLevel }> = []

  if (semantic !== undefined) {
    const v = getSemanticVerdict(semantic)
    parts.push(`Семантическая беглость: ${semantic} (${v.label})`)
    levels.push({ name: 'семантическую беглость', level: v.level })
  }
  if (phonetic !== undefined) {
    const v = getPhoneticVerdict(phonetic)
    parts.push(`Фонетическая беглость: ${phonetic} (${v.label})`)
    levels.push({ name: 'фонетическую беглость', level: v.level })
  }
  if (picnaming !== undefined) {
    const v = getPicNamingVerdict(picnaming.correct, picnaming.total)
    parts.push(`Пикнейминг: ${picnaming.correct}/${picnaming.total} (${v.label})`)
    levels.push({ name: 'пикнейминг', level: v.level })
  }

  const sorted = [...levels].sort(
    (a, b) => levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level)
  )
  const weakest = sorted[0]?.name ?? ''
  const summary = parts.join('\n')
  const recommendation = weakest
    ? `Подтяните ${weakest} — она отстаёт от остальных.`
    : 'Продолжайте тренироваться!'

  return { summary, weakest, recommendation }
}
