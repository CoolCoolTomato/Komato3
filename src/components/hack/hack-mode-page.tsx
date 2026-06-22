import { useEffect, useRef, useState } from "react"

import { HackerBackground } from "@/components/hack/hacker-background"
import { HackSectionOne } from "@/components/hack/hack-section-one"
import { HackSectionThree } from "@/components/hack/hack-section-three"
import { HackSectionTwo } from "@/components/hack/hack-section-two"

const screenAnchors = [0, 1, 2]
const secondScreenProgress = 0.25
const thirdScreenProgress = 1

const anchorScrollDuration = 700
const sectionExitDuration = 360
const sectionEnterDuration = 460

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
  if (anchorIndex <= 0) return 0
  if (anchorIndex === 1) return secondScreenProgress
  return thirdScreenProgress
}

type TransitionPhase = "idle" | "exiting" | "entering"

function useHackAnchorScroll(rootRef: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0)
  const [activeAnchor, setActiveAnchor] = useState(0)
  const [fromAnchor, setFromAnchor] = useState(0)
  const [toAnchor, setToAnchor] = useState(0)
  const [phase, setPhase] = useState<TransitionPhase>("idle")

  const currentAnchorRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(false)
  const exitTimerRef = useRef<number | null>(null)
  const enterTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const clearTimers = () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current)
        exitTimerRef.current = null
      }

      if (enterTimerRef.current !== null) {
        window.clearTimeout(enterTimerRef.current)
        enterTimerRef.current = null
      }
    }

    const cancelAnimation = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      isAnimatingRef.current = false
    }

    const scrollToAnchor = (nextAnchor: number) => {
      const prevAnchor = currentAnchorRef.current

      if (nextAnchor === prevAnchor) return

      const rootTop = getRootTop(root)
      const viewportHeight = Math.max(window.innerHeight, 1)
      const startY = window.scrollY
      const targetY = rootTop + nextAnchor * viewportHeight
      const startTime = performance.now()

      clearTimers()
      cancelAnimation()

      isAnimatingRef.current = true
      currentAnchorRef.current = nextAnchor

      setFromAnchor(prevAnchor)
      setToAnchor(nextAnchor)
      setPhase("exiting")

      exitTimerRef.current = window.setTimeout(() => {
        setProgress(getProgressFromAnchor(nextAnchor))
        setActiveAnchor(nextAnchor)
        setPhase("entering")

        enterTimerRef.current = window.setTimeout(() => {
          setPhase("idle")
        }, sectionEnterDuration)
      }, sectionExitDuration)

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
      if (isAnimatingRef.current) return

      const rootTop = getRootTop(root)
      const viewportHeight = Math.max(window.innerHeight, 1)
      const scrollInRoot = Math.max(window.scrollY - rootTop, 0)

      const nextAnchor = clamp(
        Math.round(scrollInRoot / viewportHeight),
        0,
        screenAnchors.length - 1,
      )

      currentAnchorRef.current = nextAnchor
      setActiveAnchor(nextAnchor)
      setFromAnchor(nextAnchor)
      setToAnchor(nextAnchor)
      setPhase("idle")
      setProgress(getProgressFromAnchor(nextAnchor))
    }

    const handleWheel = (event: WheelEvent) => {
      if (!root.contains(event.target as Node)) return

      event.preventDefault()

      if (isAnimatingRef.current) return

      const direction = event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : 0
      if (direction === 0) return

      const nextAnchor = clamp(
        currentAnchorRef.current + direction,
        0,
        screenAnchors.length - 1,
      )

      scrollToAnchor(nextAnchor)
    }

    syncAnchorFromScroll()

    window.addEventListener("scroll", syncAnchorFromScroll, { passive: true })
    window.addEventListener("wheel", handleWheel, { passive: false })
    window.addEventListener("resize", syncAnchorFromScroll)

    return () => {
      clearTimers()
      cancelAnimation()
      window.removeEventListener("scroll", syncAnchorFromScroll)
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("resize", syncAnchorFromScroll)
    }
  }, [rootRef])

  return {
    progress,
    activeAnchor,
    fromAnchor,
    toAnchor,
    phase,
  }
}

const sections = [
  <HackSectionOne key="section-one" />,
  <HackSectionTwo key="section-two" />,
  <HackSectionThree key="section-three" />,
]

function SectionLayer({
  index,
  activeAnchor,
  fromAnchor,
  toAnchor,
  phase,
}: {
  index: number
  activeAnchor: number
  fromAnchor: number
  toAnchor: number
  phase: TransitionPhase
}) {
  const isIdleActive = phase === "idle" && index === activeAnchor
  const isExiting = phase === "exiting" && index === fromAnchor
  const isEntering = phase === "entering" && index === toAnchor

  const visible = isIdleActive || isExiting || isEntering

  return (
    <div
      className={[
        "absolute inset-0 transition-all ease-[cubic-bezier(0.22,1,0.36,1)]",
        isExiting
          ? "z-20 opacity-0 blur-xl scale-[0.985] [clip-path:inset(0_0_100%_0)]"
          : "",
        isEntering
          ? "z-30 opacity-100 blur-0 scale-100 [clip-path:inset(0_0_0_0)]"
          : "",
        isIdleActive
          ? "z-10 opacity-100 blur-0 scale-100 [clip-path:inset(0_0_0_0)]"
          : "",
        !visible
          ? "pointer-events-none z-0 opacity-0 blur-xl scale-[1.015] [clip-path:inset(100%_0_0_0)]"
          : "",
      ].join(" ")}
      style={{
        transitionDuration: isExiting
          ? `${sectionExitDuration}ms`
          : `${sectionEnterDuration}ms`,
      }}
    >
      {sections[index]}
    </div>
  )
}

export function HackModePage() {
  const rootRef = useRef<HTMLElement>(null)

  const { progress, activeAnchor, fromAnchor, toAnchor, phase } =
    useHackAnchorScroll(rootRef)

  return (
    <main ref={rootRef} className="relative min-h-[300svh] bg-[#050706]">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="sticky top-0 h-svh overflow-hidden">
          <div className="absolute inset-0">
            <HackerBackground progress={progress} />
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-10 h-svh overflow-hidden">
        {sections.map((_, index) => (
          <SectionLayer
            key={index}
            index={index}
            activeAnchor={activeAnchor}
            fromAnchor={fromAnchor}
            toAnchor={toAnchor}
            phase={phase}
          />
        ))}
      </div>
    </main>
  )
}