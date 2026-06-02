import { useEffect, useRef, useState } from "react"

import { clamp, getScrollContainer } from "@/lib/scroll"

const titleFillDamping = 0.28

type SectionTitleBandProps = {
  title: string
  className?: string
  scrollRootRef?: React.RefObject<HTMLElement | null>
}

export function SectionTitleBand({
  title,
  className = "h-full",
  scrollRootRef,
}: SectionTitleBandProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const progressRef = useRef(0)
  const targetProgressRef = useRef(0)
  const animationFrameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const animateProgress = () => {
      const nextProgress =
        progressRef.current +
        (targetProgressRef.current - progressRef.current) * titleFillDamping

      progressRef.current =
        Math.abs(targetProgressRef.current - nextProgress) < 0.001
          ? targetProgressRef.current
          : nextProgress

      setProgress(progressRef.current)
      animationFrameRef.current = window.requestAnimationFrame(animateProgress)
    }

    animationFrameRef.current = window.requestAnimationFrame(animateProgress)

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current

    if (!root) {
      return
    }

    const container = getScrollContainer(root)

    if (!container) {
      return
    }

    const scrollSection =
      scrollRootRef?.current ??
      (Array.from(container.children).find((child) =>
        child.contains(root),
      ) as HTMLElement | undefined)

    if (!scrollSection) {
      return
    }

    const updateProgress = () => {
      const start = scrollSection.offsetTop - container.clientHeight
      const end = scrollSection.offsetTop
      const nextProgress = clamp(
        (container.scrollTop - start) / Math.max(end - start, 1),
        0,
        1,
      )

      targetProgressRef.current = nextProgress
    }

    updateProgress()
    container.addEventListener("scroll", updateProgress, { passive: true })
    window.addEventListener("resize", updateProgress)

    return () => {
      container.removeEventListener("scroll", updateProgress)
      window.removeEventListener("resize", updateProgress)
    }
  }, [scrollRootRef])

  return (
    <div
      ref={rootRef}
      className={`relative overflow-hidden border-b border-[#ff3f32]/55 ${className}`}
    >
      <div
        className="absolute bottom-0 right-0 top-0 w-full bg-[#ff3f32]"
        style={{ right: `${progress * 100}%` }}
      />
      <h2 className="relative z-10 flex h-full items-center px-6 text-[clamp(1.2rem,5vw,2.5rem)] font-black leading-none tracking-[-0.04em] text-[#ff3f32] md:px-10 md:text-[clamp(1.8rem,3.4vw,3.8rem)]">
        {title}
      </h2>
    </div>
  )
}
