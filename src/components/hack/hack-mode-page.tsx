import { useEffect, useRef, useState } from "react"

import { HackerBackground } from "@/components/hack/hacker-background"
import { HackSectionOne } from "@/components/hack/hack-section-one"
import { HackSectionThree } from "@/components/hack/hack-section-three"
import { HackSectionTwo } from "@/components/hack/hack-section-two"

const screenAnchors = [0, 1, 2]
const secondScreenProgress = 0.25
const thirdScreenProgress = 1
const anchorScrollDuration = 700

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

function getRootTop(root: HTMLElement) {
  return root.getBoundingClientRect().top + window.scrollY
}

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function getProgressFromAnchor(anchorIndex: number) {
  if (anchorIndex <= 0) {
    return 0
  }

  if (anchorIndex === 1) {
    return secondScreenProgress
  }

  return thirdScreenProgress
}

function useHackAnchorScroll(rootRef: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0)
  const currentAnchorRef = useRef(0)
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

    const scrollToAnchor = (nextAnchor: number) => {
      const rootTop = getRootTop(root)
      const viewportHeight = Math.max(window.innerHeight, 1)
      const startY = window.scrollY
      const targetY = rootTop + nextAnchor * viewportHeight
      const startTime = performance.now()

      cancelAnimation()
      isAnimatingRef.current = true
      currentAnchorRef.current = nextAnchor
      setProgress(getProgressFromAnchor(nextAnchor))

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

    const syncAnchorFromScroll = () => {
      if (isAnimatingRef.current) {
        return
      }

      const rootTop = getRootTop(root)
      const viewportHeight = Math.max(window.innerHeight, 1)
      const scrollInRoot = Math.max(window.scrollY - rootTop, 0)
      const nextAnchor = clamp(
        Math.round(scrollInRoot / viewportHeight),
        0,
        screenAnchors.length - 1,
      )

      currentAnchorRef.current = nextAnchor
      setProgress(getProgressFromAnchor(nextAnchor))
    }

    const handleWheel = (event: WheelEvent) => {
      if (!root.contains(event.target as Node)) {
        return
      }

      event.preventDefault()

      if (isAnimatingRef.current) {
        return
      }

      const direction = event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : 0

      if (direction === 0) {
        return
      }

      const nextAnchor = clamp(
        currentAnchorRef.current + direction,
        0,
        screenAnchors.length - 1,
      )

      if (nextAnchor === currentAnchorRef.current) {
        return
      }

      scrollToAnchor(nextAnchor)
    }

    syncAnchorFromScroll()
    window.addEventListener("scroll", syncAnchorFromScroll, { passive: true })
    window.addEventListener("wheel", handleWheel, { passive: false })
    window.addEventListener("resize", syncAnchorFromScroll)

    return () => {
      cancelAnimation()
      window.removeEventListener("scroll", syncAnchorFromScroll)
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("resize", syncAnchorFromScroll)
    }
  }, [rootRef])

  return progress
}

export function HackModePage() {
  const rootRef = useRef<HTMLElement>(null)
  const progress = useHackAnchorScroll(rootRef)

  return (
    <main
      ref={rootRef}
      className="relative min-h-[300svh] bg-[#050706]"
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="sticky top-0 h-svh overflow-hidden">
          <div className="absolute inset-0">
            <HackerBackground progress={progress} />
          </div>
        </div>
      </div>
      <div className="relative z-10">
        <HackSectionOne />
        <HackSectionTwo />
        <HackSectionThree />
      </div>
    </main>
  )
}
