import { useNavigate } from 'react-router-dom'
import ExerciseCard from '../components/ExerciseCard'
import { EXERCISES } from '../exercises/types'

export default function ExerciseCatalog() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 max-w-2xl mx-auto">
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Назад
        </button>
        <h1 className="text-2xl font-bold text-white">Упражнения</h1>
      </header>

      <div className="grid gap-4">
        {EXERCISES.map(exercise => (
          <ExerciseCard key={exercise.id} exercise={exercise} />
        ))}
      </div>
    </div>
  )
}
