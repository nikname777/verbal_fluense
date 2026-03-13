import { useNavigate } from 'react-router-dom'
import type { SkillData } from '../db/sessions'
import { CATEGORY_NAMES } from '../exercises/categories'

const RUSSIAN_ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЫЬЭЮЯ'.split('')

type SkillColor = 'green' | 'yellow' | 'red' | 'gray'

function getSemanticColor(score: number): SkillColor {
  if (score >= 22) return 'green'
  if (score >= 13) return 'yellow'
  return 'red'
}

function getPhoneticColor(score: number): SkillColor {
  if (score >= 15) return 'green'
  if (score >= 11) return 'yellow'
  return 'red'
}

const COLOR_CLASSES: Record<SkillColor, { bg: string; text: string; border: string }> = {
  green:  { bg: 'bg-green-900/50',  text: 'text-green-300',  border: 'border-green-700/50' },
  yellow: { bg: 'bg-yellow-900/50', text: 'text-yellow-300', border: 'border-yellow-700/50' },
  red:    { bg: 'bg-red-900/50',    text: 'text-red-300',    border: 'border-red-700/50' },
  gray:   { bg: 'bg-gray-800/50',   text: 'text-gray-500',   border: 'border-gray-700/30' },
}

interface SkillsMapProps {
  skills: SkillData[]
}

interface SemanticCardProps {
  category: string
  skill: SkillData | undefined
  onClick: () => void
}

function SemanticCard({ category, skill, onClick }: SemanticCardProps) {
  const color: SkillColor = skill?.lastScore != null
    ? getSemanticColor(skill.lastScore)
    : 'gray'
  const cls = COLOR_CLASSES[color]

  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-start p-3 rounded-xl border
        transition-all duration-150 hover:brightness-110 active:scale-[0.97]
        text-left w-full
        ${cls.bg} ${cls.border}
      `}
    >
      <span className={`text-xs font-medium leading-tight ${cls.text}`}>{category}</span>
      {skill?.lastScore != null ? (
        <span className="text-lg font-bold text-white mt-1">{skill.lastScore}</span>
      ) : (
        <span className="text-xs text-gray-600 mt-1">—</span>
      )}
      {skill && (
        <span className="text-xs text-gray-600 mt-0.5">{skill.sessionCount} сес.</span>
      )}
    </button>
  )
}

interface PhoneticCellProps {
  letter: string
  skill: SkillData | undefined
  onClick: () => void
}

function PhoneticCell({ letter, skill, onClick }: PhoneticCellProps) {
  const color: SkillColor = skill?.lastScore != null
    ? getPhoneticColor(skill.lastScore)
    : 'gray'
  const cls = COLOR_CLASSES[color]

  return (
    <button
      onClick={onClick}
      title={skill ? `${letter}: ${skill.lastScore} слов (${skill.sessionCount} сес.)` : `${letter}: не тренировалось`}
      className={`
        h-9 w-full rounded-lg border text-sm font-semibold
        transition-all duration-150 hover:brightness-125 active:scale-[0.95]
        ${cls.bg} ${cls.border} ${cls.text}
      `}
    >
      {letter}
    </button>
  )
}

export default function SkillsMap({ skills }: SkillsMapProps) {
  const navigate = useNavigate()

  const semanticSkills = new Map(
    skills
      .filter(s => s.exerciseId === 'semantic')
      .map(s => [s.key, s])
  )

  const phoneticSkills = new Map(
    skills
      .filter(s => s.exerciseId === 'phonetic')
      .map(s => [s.key, s])
  )

  const trainedLetters = phoneticSkills.size

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">Карта навыков</h2>

      {/* Semantic section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Семантическая беглость</span>
          <span className="text-xs text-gray-600">
            {semanticSkills.size} из {CATEGORY_NAMES.length} категорий
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORY_NAMES.map(cat => (
            <SemanticCard
              key={cat}
              category={cat}
              skill={semanticSkills.get(cat)}
              onClick={() => navigate('/exercise/semantic/setup')}
            />
          ))}
        </div>
      </div>

      {/* Phonetic section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Фонетическая беглость</span>
          <span className="text-xs text-gray-600">
            {trainedLetters} из {RUSSIAN_ALPHABET.length} букв
          </span>
        </div>
        <div className="grid grid-cols-8 gap-1.5">
          {RUSSIAN_ALPHABET.map(letter => (
            <PhoneticCell
              key={letter}
              letter={letter}
              skill={phoneticSkills.get(letter)}
              onClick={() => navigate('/exercise/phonetic/setup')}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-900/50 border border-green-700/50 inline-block" />
            Хороший (15+)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-yellow-900/50 border border-yellow-700/50 inline-block" />
            Базовый (11–14)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-900/50 border border-red-700/50 inline-block" />
            Низкий (&lt;11)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gray-800/50 border border-gray-700/30 inline-block" />
            Не тренировалось
          </span>
        </div>
      </div>
    </div>
  )
}
