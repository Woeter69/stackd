import { useState, useRef, useCallback } from 'react'
import type { ChipValue } from '../types'

export interface FlyingChip {
  id: string
  value: ChipValue
  /** pixel coords relative to the table viewport where the chip starts */
  fromX: number
  fromY: number
  /** pixel coords where it lands (center pot) */
  toX: number
  toY: number
}

/**
 * useBetAnimation — manages a list of chips currently flying across the table.
 * Consumers call `fireChip(value, fromEl, toEl)` which captures the bounding
 * rects of the sender seat and the pot zone, then removes the chip after the
 * CSS animation completes.
 */
export function useBetAnimation() {
  const [chips, setChips] = useState<FlyingChip[]>([])
  const tableRef = useRef<HTMLDivElement | null>(null)

  const fireChip = useCallback(
    (value: ChipValue, fromEl: HTMLElement | null, toEl: HTMLElement | null) => {
      if (!fromEl || !toEl || !tableRef.current) return

      const tableRect = tableRef.current.getBoundingClientRect()
      const fromRect = fromEl.getBoundingClientRect()
      const toRect = toEl.getBoundingClientRect()

      const chip: FlyingChip = {
        id: `${Date.now()}-${Math.random()}`,
        value,
        fromX: fromRect.left + fromRect.width / 2 - tableRect.left,
        fromY: fromRect.top + fromRect.height / 2 - tableRect.top,
        toX: toRect.left + toRect.width / 2 - tableRect.left,
        toY: toRect.top + toRect.height / 2 - tableRect.top,
      }

      setChips((prev) => [...prev, chip])

      // Remove after animation completes (600ms)
      setTimeout(() => {
        setChips((prev) => prev.filter((c) => c.id !== chip.id))
      }, 650)
    },
    [],
  )

  return { chips, tableRef, fireChip }
}
