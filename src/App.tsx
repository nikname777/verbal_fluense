import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './screens/Dashboard'
import ExerciseCatalog from './screens/ExerciseCatalog'
import ExerciseSetup from './screens/ExerciseSetup'
import TrainingScreen from './screens/TrainingScreen'
import ResultsScreen from './screens/ResultsScreen'
import PicNaming from './screens/PicNaming'
import PicNamingResults from './screens/PicNamingResults'
import HistoryScreen from './screens/HistoryScreen'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/exercises" element={<ExerciseCatalog />} />
        <Route path="/exercise/picnaming/setup" element={<ExerciseSetup />} />
        <Route path="/exercise/picnaming/train" element={<PicNaming />} />
        <Route path="/exercise/picnaming/results" element={<PicNamingResults />} />
        <Route path="/exercise/:id/setup" element={<ExerciseSetup />} />
        <Route path="/exercise/:id/train" element={<TrainingScreen />} />
        <Route path="/exercise/:id/results" element={<ResultsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
