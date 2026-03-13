interface RecordingIndicatorProps {
  isListening: boolean
}

export default function RecordingIndicator({ isListening }: RecordingIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`
          w-3 h-3 rounded-full
          ${isListening
            ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50'
            : 'bg-gray-600'
          }
        `}
      />
      <span className={`text-sm font-medium ${isListening ? 'text-red-400' : 'text-gray-500'}`}>
        {isListening ? 'Запись' : 'Ожидание...'}
      </span>
    </div>
  )
}
