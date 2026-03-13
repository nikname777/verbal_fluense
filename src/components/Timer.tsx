interface TimerProps {
  timeLeft: number
  duration: number
  progress: number
  size?: number
}

export default function Timer({ timeLeft, duration, progress, size = 200 }: TimerProps) {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const label = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  const color =
    progress > 0.5 ? '#22c55e' : progress > 0.25 ? '#f59e0b' : '#ef4444'

  const isLow = progress <= 0.25 && timeLeft > 0

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="absolute"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1f2937"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
      </svg>
      <span
        className={`font-mono text-4xl font-bold tabular-nums z-10 transition-colors duration-500 ${
          isLow ? 'text-red-400' : 'text-white'
        }`}
        style={{ fontSize: size * 0.22 }}
      >
        {label}
      </span>
    </div>
  )
}

export function useDurationLabel(seconds: number): string {
  if (seconds < 60) return `${seconds} сек`
  return `${seconds / 60} мин`
}
