import { useEffect, useRef, useState } from "react"

import { clamp, getScrollContainer } from "@/lib/scroll"

const revealStartProgress = 0.25
const imageInset = 30
const imageStartScale = 1.5
const revealDamping = 0.3

type ProductRevealFrameProps = {
  src: string
  alt: string
}

export function ProductRevealFrame({ src, alt }: ProductRevealFrameProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const progressRef = useRef(0)
  const targetProgressRef = useRef(0)
  const animationFrameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const animateProgress = () => {
      const nextProgress =
        progressRef.current +
        (targetProgressRef.current - progressRef.current) * revealDamping

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

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) {
        return
      }

      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })

    observer.observe(root)

    return () => {
      observer.disconnect()
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

    const scrollSection = Array.from(container.children).find((child) =>
      child.contains(root),
    ) as HTMLElement | undefined

    if (!scrollSection) {
      return
    }

    const updateProgress = () => {
      const start = scrollSection.offsetTop - container.clientHeight
      const end = scrollSection.offsetTop
      const rawProgress = clamp(
        (container.scrollTop - start) / Math.max(end - start, 1),
        0,
        1,
      )
      const nextProgress = clamp(
        (rawProgress - revealStartProgress) / (1 - revealStartProgress),
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
  }, [])

  const imageWidth = Math.max(size.width - imageInset * 2, 0)
  const imageHeight = Math.max(size.height - imageInset * 2, 0)
  const imageLeft = imageWidth ? imageInset : 0
  const imageTop = imageHeight ? imageInset : 0
  const revealWidth = progress * imageWidth
  const revealHeight = progress * imageHeight
  const fixedImageWidth = imageWidth || "100%"
  const fixedImageHeight = imageHeight || "100%"
  const imageScale = imageStartScale - (imageStartScale - 1) * progress
  return (
    <div ref={rootRef} className="relative h-full min-h-0 w-full overflow-hidden">
      <div
        className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-[#ff3f32]/20"
        style={{ left: imageLeft }}
      />
      <div
        className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-[#ff3f32]/20"
        style={{ left: imageLeft + revealWidth }}
      />
      <div
        className="pointer-events-none absolute left-0 right-0 z-20 h-px bg-[#ff3f32]/20"
        style={{ top: imageTop }}
      />
      <div
        className="pointer-events-none absolute left-0 right-0 z-20 h-px bg-[#ff3f32]/20"
        style={{ top: imageTop + revealHeight }}
      />
      <div
        className="absolute z-10 overflow-hidden"
        style={{
          left: imageLeft,
          top: imageTop,
          width: revealWidth,
          height: revealHeight,
        }}
      >
        <div
          style={{
            width: fixedImageWidth,
            height: fixedImageHeight,
            transform: `scale(${imageScale})`,
            transformOrigin: "top left",
          }}
        >
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  )
}