import { useNavigate } from 'react-router-dom'
import type { ExerciseDefinition } from '../exercises/types'

interface ExerciseCardProps {
  exercise: ExerciseDefinition
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/exercise/${exercise.id}/setup`)}
      className="
        w-full text-left
        bg-gray-900 hover:bg-gray-800
        border border-gray-800 hover:border-gray-700
        rounded-2xl p-6
        transition-all duration-200
        active:scale-[0.98]
        group
      "
    >
      <div className="flex items-start gap-4">
        <span className="text-4xl">{exercise.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 font-medium">{exercise.subtitle}</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
              {exercise.level}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
            {exercise.title}
          </h3>
          <p className="text-sm text-gray-400 mt-1">{exercise.description}</p>
        </div>
        <span className="text-gray-600 group-hover:text-gray-400 text-xl">→</span>
      </div>
    </button>
  )
}
