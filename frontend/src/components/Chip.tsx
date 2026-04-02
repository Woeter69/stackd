import type { ChipValue } from '../types'

interface ChipProps {
  value: ChipValue
  colorClass: string
  size?: number
}

/**
 * Casino chip rendered as a pure inline SVG.
 * Color is inherited from `currentColor` via the `colorClass` prop.
 */
export default function Chip({ value, colorClass, size = 48 }: ChipProps) {
  return (
    <div className={`flex flex-col items-center gap-1 select-none ${colorClass}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer ring */}
        <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2.5" />
        {/* Inner ring */}
        <circle cx="24" cy="24" r="16" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
        {/* Center fill */}
        <circle cx="24" cy="24" r="11" fill="currentColor" fillOpacity="0.3" />
        {/* Notches on outer ring at 0°, 90°, 180°, 270° */}
        <rect x="22.5" y="2" width="3" height="5" rx="1" fill="currentColor" />
        <rect x="22.5" y="41" width="3" height="5" rx="1" fill="currentColor" />
        <rect x="2" y="22.5" width="5" height="3" rx="1" fill="currentColor" />
        <rect x="41" y="22.5" width="5" height="3" rx="1" fill="currentColor" />
        {/* Value label */}
        <text
          x="24"
          y="28"
          textAnchor="middle"
          fontSize={value >= 100 ? 9 : 11}
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          fill="currentColor"
        >
          ${value}
        </text>
      </svg>
    </div>
  )
}
