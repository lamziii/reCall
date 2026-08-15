export type Placement =
  | 'bottom-start'
  | 'bottom-end'
  | 'bottom'
  | 'top-start'
  | 'top-end'
  | 'top'
  | 'right'
  | 'left'

const GAP = 8
const VIEWPORT_PADDING = 8

/** Fixed-position coordinates for `content` anchored to `trigger`, flipped if it would overflow the viewport. */
export function getPopoverPosition(
  trigger: DOMRect,
  content: { width: number; height: number },
  placement: Placement,
): { top: number; left: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  const positions: Record<Placement, { top: number; left: number }> = {
    bottom: { top: trigger.bottom + GAP, left: trigger.left + trigger.width / 2 - content.width / 2 },
    'bottom-start': { top: trigger.bottom + GAP, left: trigger.left },
    'bottom-end': { top: trigger.bottom + GAP, left: trigger.right - content.width },
    top: { top: trigger.top - content.height - GAP, left: trigger.left + trigger.width / 2 - content.width / 2 },
    'top-start': { top: trigger.top - content.height - GAP, left: trigger.left },
    'top-end': { top: trigger.top - content.height - GAP, left: trigger.right - content.width },
    right: { top: trigger.top + trigger.height / 2 - content.height / 2, left: trigger.right + GAP },
    left: { top: trigger.top + trigger.height / 2 - content.height / 2, left: trigger.left - content.width - GAP },
  }

  let { top, left } = positions[placement]

  const overflowsBottom = top + content.height > vh - VIEWPORT_PADDING
  const overflowsTop = top < VIEWPORT_PADDING
  if (placement.startsWith('bottom') && overflowsBottom) {
    top = trigger.top - content.height - GAP
  } else if (placement.startsWith('top') && overflowsTop) {
    top = trigger.bottom + GAP
  }

  left = Math.min(Math.max(left, VIEWPORT_PADDING), vw - content.width - VIEWPORT_PADDING)
  top = Math.min(Math.max(top, VIEWPORT_PADDING), vh - content.height - VIEWPORT_PADDING)

  return { top, left }
}
