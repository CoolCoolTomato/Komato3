import { HackAnchorOne } from "./hack-anchor-one"
import { HackAnchorTwo } from ".//hack-anchor-two"
import { HackAnchorZero } from "./hack-anchor-zero"
import { clamp, type HackTransitionPhase } from "./shared"

export type { HackTransitionPhase } from "./shared"

const circleEnterDelay = 0.32

function delayedProgress(value: number, delay: number) {
  if (value <= delay) return 0
  return clamp((value - delay) / (1 - delay), 0, 1)
}

function getOverlayValues({
  activeAnchor,
  fromAnchor,
  toAnchor,
  phase,
  transitionProgress,
}: {
  activeAnchor: number
  fromAnchor: number
  toAnchor: number
  phase: HackTransitionPhase
  transitionProgress: number
}) {
  const moving = phase !== "idle" && fromAnchor !== toAnchor
  const t = moving ? clamp(transitionProgress, 0, 1) : 1

  if (!moving) {
    return {
      anchorZeroOpacity: activeAnchor === 0 ? 0.38 : 0,
      anchorZeroDissolveProgress: activeAnchor === 0 ? 0 : 1,
      anchorOneCircleProgress: activeAnchor === 1 ? 1 : 0,
      anchorTwoOpacity: activeAnchor === 2 ? 1 : 0,
    }
  }

  const anchorZeroFrom = fromAnchor === 0 ? 1 : 0
  const anchorZeroTo = toAnchor === 0 ? 1 : 0
  const anchorZeroPresence = anchorZeroFrom + (anchorZeroTo - anchorZeroFrom) * t

  let anchorOneCircleProgress = 0

  if (fromAnchor === 1 && toAnchor !== 1) {
    anchorOneCircleProgress = 1 - t
  } else if (fromAnchor !== 1 && toAnchor === 1) {
    anchorOneCircleProgress = delayedProgress(t, circleEnterDelay)
  } else if (fromAnchor === 1 && toAnchor === 1) {
    anchorOneCircleProgress = 1
  }

  const anchorTwoFrom = fromAnchor === 2 ? 1 : 0
  const anchorTwoTo = toAnchor === 2 ? 1 : 0
  const anchorTwoPresence = anchorTwoFrom + (anchorTwoTo - anchorTwoFrom) * t

  return {
    anchorZeroOpacity: clamp(0.38 * anchorZeroPresence, 0, 1),
    anchorZeroDissolveProgress: clamp(1 - anchorZeroPresence, 0, 1),
    anchorOneCircleProgress: clamp(anchorOneCircleProgress, 0, 1),
    anchorTwoOpacity: clamp(anchorTwoPresence, 0, 1),
  }
}

export function HackTransitionOverlay({
  activeAnchor,
  fromAnchor,
  toAnchor,
  phase,
  transitionProgress,
}: {
  activeAnchor: number
  fromAnchor: number
  toAnchor: number
  phase: HackTransitionPhase
  transitionProgress: number
}) {
  const {
    anchorZeroOpacity,
    anchorZeroDissolveProgress,
    anchorOneCircleProgress,
  } = getOverlayValues({
    activeAnchor,
    fromAnchor,
    toAnchor,
    phase,
    transitionProgress,
  })

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <HackAnchorZero
        opacity={anchorZeroOpacity}
        dissolveProgress={anchorZeroDissolveProgress}
      />

      <HackAnchorOne
        circleProgress={anchorOneCircleProgress}
        phase={phase}
      />

      <HackAnchorTwo />
    </div>
  )
}