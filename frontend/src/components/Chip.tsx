import type { ChipValue } from '../types'

/** Per-denomination fill colors and gradients */
const CHIP_STYLES: Record<ChipValue, { base: string; light: string; dark: string; text: string }> = {
  1:   { base: '#94a3b8', light: '#e2e8f0', dark: '#475569', text: '#0f172a' },
  5:   { base: '#ef4444', light: '#fca5a5', dark: '#991b1b', text: '#fff' },
  25:  { base: '#22c55e', light: '#86efac', dark: '#15803d', text: '#fff' },
  100: { base: '#3b82f6', light: '#93c5fd', dark: '#1d4ed8', text: '#fff' },
  500: { base: '#a855f7', light: '#d8b4fe', dark: '#7e22ce', text: '#fff' },
}

interface ChipProps {
  value: ChipValue
  size?: number
  /** Extra CSS classes on the wrapper */
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

/**
 * 3D-bevel casino chip with per-denomination colors.
 * No external deps – pure inline SVG with gradients.
 */
export default function Chip({ value, size = 48, className = '', style, onClick }: ChipProps) {
  const s = CHIP_STYLES[value]
  const gradId = `chip-grad-${value}`
  const bevelId = `chip-bevel-${value}`

  return (
    <button
      onClick={onClick}
      className={`select-none focus:outline-none ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : 'cursor-default'} ${className}`}
      style={style}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial gradient for 3D bevel */}
          <radialGradient id={gradId} cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor={s.light} stopOpacity="1" />
            <stop offset="50%" stopColor={s.base} stopOpacity="1" />
            <stop offset="100%" stopColor={s.dark} stopOpacity="1" />
          </radialGradient>
          {/* Inner shadow via gradient */}
          <radialGradient id={bevelId} cx="60%" cy="65%" r="65%">
            <stop offset="0%" stopColor={s.dark} stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Drop shadow */}
        <ellipse cx="26" cy="28" rx="21" ry="3.5" fill="black" fillOpacity="0.25" />

        {/* Main body */}
        <circle cx="26" cy="25" r="23" fill={`url(#${gradId})`} />
        {/* Bevel shadow overlay */}
        <circle cx="26" cy="25" r="23" fill={`url(#${bevelId})`} />

        {/* Outer rim */}
        <circle cx="26" cy="25" r="23" stroke={s.dark} strokeWidth="1.5" fill="none" />

        {/* Inner ring */}
        <circle cx="26" cy="25" r="17" stroke={s.light} strokeWidth="1.2" strokeOpacity="0.6" fill="none" />

        {/* Notches at 4 cardinal points */}
        <rect x="24.5" y="2"  width="3" height="5" rx="1.5" fill={s.light} fillOpacity="0.9" />
        <rect x="24.5" y="45" width="3" height="5" rx="1.5" fill={s.light} fillOpacity="0.9" />
        <rect x="2"   y="23.5" width="5" height="3" rx="1.5" fill={s.light} fillOpacity="0.9" />
        <rect x="45"  y="23.5" width="5" height="3" rx="1.5" fill={s.light} fillOpacity="0.9" />

        {/* Center label */}
        <text
          x="26"
          y="30"
          textAnchor="middle"
          fontSize={value >= 100 ? 10 : 12}
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          fill={s.text}
          style={{ textShadow: `0 1px 2px ${s.dark}` }}
        >
          ${value}
        </text>
      </svg>
    </button>
  )
}
