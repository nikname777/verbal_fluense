interface WordChipProps {
  word: string
  status: 'valid' | 'pending' | 'error'
  errorReason?: string
  onClick?: () => void
  index?: number
}

const STATUS_CLASSES = {
  valid: 'bg-green-900/60 text-green-300 border-green-700/50',
  pending: 'bg-yellow-900/60 text-yellow-300 border-yellow-700/50 cursor-pointer hover:bg-yellow-800/80',
  error: 'bg-red-900/60 text-red-300 border-red-700/50',
}

export default function WordChip({ word, status, errorReason, onClick, index }: WordChipProps) {
  return (
    <div className="relative group inline-block">
      <button
        onClick={status === 'pending' ? onClick : undefined}
        disabled={status !== 'pending'}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
          border text-sm font-medium
          transition-all duration-200
          ${STATUS_CLASSES[status]}
          ${status === 'pending' ? 'active:scale-95' : ''}
        `}
      >
        {index !== undefined && (
          <span className="text-xs opacity-50">{index + 1}.</span>
        )}
        {word}
        {status === 'valid' && <span className="text-xs">✓</span>}
        {status === 'error' && <span className="text-xs">✗</span>}
        {status === 'pending' && <span className="text-xs opacity-70">?</span>}
      </button>

      {(status === 'error' && errorReason) && (
        <div className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          bg-gray-800 text-white text-xs rounded px-2 py-1
          whitespace-nowrap shadow-lg
          opacity-0 group-hover:opacity-100 pointer-events-none
          transition-opacity duration-150 z-10
        ">
          {errorReason}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  )
}
