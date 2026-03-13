interface MetronomeIndicatorProps {
  pulse: boolean
  enabled: boolean
  bpm: number
}

export default function MetronomeIndicator({ pulse, enabled, bpm }: MetronomeIndicatorProps) {
  if (!enabled) return null

  return (
    <div className="flex items-center gap-2">
      <span
        className={`
          w-2.5 h-2.5 rounded-full transition-all duration-75
          ${pulse ? 'bg-blue-400 scale-125 shadow-md shadow-blue-500/50' : 'bg-blue-800'}
        `}
      />
      <span className="text-xs text-blue-400">{bpm} bpm</span>
    </div>
  )
}
