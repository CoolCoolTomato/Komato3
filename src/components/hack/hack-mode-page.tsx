import { useEffect, useRef, useState } from "react"

import { HackerBackground } from "@/components/hack/hacker-background"

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

// Adjust these three progress anchors to freeze the 3D scene at specific poses.
const progressAnchors = [0, 0.25, 1]
const anchorScrollDuration = 900

function getProgressMetrics(root: HTMLElement) {
  const rootTop = root.getBoundingClientRect().top + window.scrollY
  const scrollableDistance = Math.max(root.offsetHeight - window.innerHeight, 1)

  return {
    rootTop,
    scrollableDistance,
  }
}

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function usePageProgress(rootRef: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0

      const root = rootRef.current

      if (!root) {
        return
      }

      const { rootTop, scrollableDistance } = getProgressMetrics(root)
      const nextProgress = clamp(
        (window.scrollY - rootTop) / scrollableDistance,
        0,
        1,
      )

      setProgress(nextProgress)
    }

    const requestUpdate = () => {
      if (frame) {
        return
      }

      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", requestUpdate, { passive: true })
    window.addEventListener("resize", requestUpdate)

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }

      window.removeEventListener("scroll", requestUpdate)
      window.removeEventListener("resize", requestUpdate)
    }
  }, [rootRef])

  return progress
}

function useAnchorScroll(rootRef: React.RefObject<HTMLElement | null>) {
  const animationFrameRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(false)

  useEffect(() => {
    const root = rootRef.current

    if (!root) {
      return
    }

    const cancelAnimation = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      isAnimatingRef.current = false
    }

    const scrollToAnchor = (targetProgress: number) => {
      const { rootTop, scrollableDistance } = getProgressMetrics(root)
      const startY = window.scrollY
      const targetY = rootTop + scrollableDistance * targetProgress
      const startTime = performance.now()

      cancelAnimation()
      isAnimatingRef.current = true

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const normalizedTime = clamp(elapsed / anchorScrollDuration, 0, 1)
        const easedTime = easeInOutCubic(normalizedTime)
        const nextY = startY + (targetY - startY) * easedTime

        window.scrollTo(0, nextY)

        if (normalizedTime >= 1) {
          window.scrollTo(0, targetY)
          cancelAnimation()
          return
        }

        animationFrameRef.current = window.requestAnimationFrame(animate)
      }

      animationFrameRef.current = window.requestAnimationFrame(animate)
    }

    const handleWheel = (event: WheelEvent) => {
      if (!root.contains(event.target as Node)) {
        return
      }

      event.preventDefault()

      if (isAnimatingRef.current) {
        return
      }

      const { rootTop, scrollableDistance } = getProgressMetrics(root)
      const currentProgress = clamp(
        (window.scrollY - rootTop) / scrollableDistance,
        0,
        1,
      )
      const currentIndex = progressAnchors.reduce(
        (closestIndex, anchor, index) => {
          const closestDistance = Math.abs(
            progressAnchors[closestIndex] - currentProgress,
          )
          const currentDistance = Math.abs(anchor - currentProgress)

          return currentDistance < closestDistance ? index : closestIndex
        },
        0,
      )

      const direction = event.deltaY > 0 ? 1 : -1
      const targetIndex = clamp(
        currentIndex + direction,
        0,
        progressAnchors.length - 1,
      )

      if (targetIndex === currentIndex) {
        return
      }

      scrollToAnchor(progressAnchors[targetIndex])
    }

    window.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      cancelAnimation()
      window.removeEventListener("wheel", handleWheel)
    }
  }, [rootRef])
}

export function HackModePage() {
  const rootRef = useRef<HTMLElement>(null)
  const progress = usePageProgress(rootRef)

  useAnchorScroll(rootRef)

  return (
    <main
      ref={rootRef}
      className="relative min-h-[500svh] bg-[#050706]"
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="absolute inset-0">
          <HackerBackground progress={progress} />
        </div>
      </div>
    </main>
  )
}
