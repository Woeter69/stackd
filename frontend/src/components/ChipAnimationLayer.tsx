import { createPortal } from 'react-dom'
import Chip from './Chip'
import type { FlyingChip } from '../hooks/useBetAnimation'

/**
 * Renders all in-flight chips as position:fixed elements that animate
 * from their source coordinates to the pot.
 *
 * CSS keyframes are injected via a <style> tag once.
 */
export default function ChipAnimationLayer({ chips }: { chips: FlyingChip[] }) {
  return createPortal(
    <>
      {chips.map((chip) => {
        const dx = chip.toX - chip.fromX
        const dy = chip.toY - chip.fromY

        return (
          <div
            key={chip.id}
            style={{
              position: 'fixed',
              left: chip.fromX,
              top: chip.fromY,
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              pointerEvents: 'none',
              animation: 'chip-fly 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
              // Custom properties for the keyframe
              ['--dx' as string]: `${dx}px`,
              ['--dy' as string]: `${dy}px`,
            }}
          >
            <Chip value={chip.value} size={40} />
          </div>
        )
      })}
    </>,
    document.body,
  )
}
