import { useEffect, useRef } from "react"

import { getCachedImage, preloadImage } from "@/lib/image-cache"

type ScrollFrameSequenceProps = {
  frameCount: number
  getFrameSrc: (frame: number) => string
  alt: string
  className?: string
  scrollRootRef?: React.RefObject<HTMLElement | null>
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const frameDamping = 0.2

const getScrollContainer = (element: HTMLElement) => {
  let parent = element.parentElement

  while (parent) {
    const overflowY = window.getComputedStyle(parent).overflowY

    if (overflowY === "auto" || overflowY === "scroll") {
      return parent
    }

    parent = parent.parentElement
  }

  return null
}

export function ScrollFrameSequence({
  frameCount,
  getFrameSrc,
  alt,
  className,
  scrollRootRef,
}: ScrollFrameSequenceProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(1)
  const progressRef = useRef(0)
  const targetProgressRef = useRef(0)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const resizeObserverRef = useRef<ResizeObserver | undefined>(undefined)

  const drawFrame = (frame: number) => {
    const canvas = canvasRef.current
    const root = rootRef.current
    const image = getCachedImage(getFrameSrc(frame))

    if (!canvas || !root || !image) {
      return
    }

    const rect = root.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, Math.round(rect.width * dpr))
    const height = Math.max(1, Math.round(rect.height * dpr))

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    const context = canvas.getContext("2d")

    if (!context) {
      return
    }

    context.clearRect(0, 0, width, height)

    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight)
    const drawWidth = image.naturalWidth * scale
    const drawHeight = image.naturalHeight * scale
    const drawX = (width - drawWidth) / 2
    const drawY = (height - drawHeight) / 2

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight)
  }

  useEffect(() => {
    const root = rootRef.current

    if (!root) {
      return
    }

    const container = getScrollContainer(root)

    if (!container) {
      return
    }

    if (scrollRootRef?.current) {
      const setFrameFromProgress = (progress: number) => {
        const nextFrame = Math.round(progress * (frameCount - 1)) + 1

        if (nextFrame === frameRef.current) {
          return
        }

        frameRef.current = nextFrame
        drawFrame(nextFrame)
      }

      const animateFrameProgress = () => {
        const nextProgress =
          progressRef.current +
          (targetProgressRef.current - progressRef.current) * frameDamping

        progressRef.current =
          Math.abs(targetProgressRef.current - nextProgress) < 0.001
            ? targetProgressRef.current
            : nextProgress

        setFrameFromProgress(progressRef.current)
        animationFrameRef.current =
          window.requestAnimationFrame(animateFrameProgress)
      }

      const updateFrameFromScroll = () => {
        const scrollRoot = scrollRootRef.current

        if (!scrollRoot) {
          return
        }

        const scrollDistance = Math.max(
          scrollRoot.offsetHeight - container.clientHeight,
          1,
        )
        const sectionStart = scrollRoot.offsetTop
        const sectionEnd = sectionStart + scrollDistance
        const nextProgress = clamp(
          (container.scrollTop - sectionStart) / (sectionEnd - sectionStart),
          0,
          1,
        )

        targetProgressRef.current = nextProgress
      }

      updateFrameFromScroll()
      progressRef.current = targetProgressRef.current
      setFrameFromProgress(progressRef.current)
      drawFrame(frameRef.current)

      resizeObserverRef.current = new ResizeObserver(() => {
        drawFrame(frameRef.current)
      })
      resizeObserverRef.current.observe(root)

      animationFrameRef.current =
        window.requestAnimationFrame(animateFrameProgress)
      container.addEventListener("scroll", updateFrameFromScroll, {
        passive: true,
      })
      window.addEventListener("resize", updateFrameFromScroll)

      return () => {
        if (animationFrameRef.current) {
          window.cancelAnimationFrame(animationFrameRef.current)
        }

        resizeObserverRef.current?.disconnect()
        container.removeEventListener("scroll", updateFrameFromScroll)
        window.removeEventListener("resize", updateFrameFromScroll)
      }
    }

  }, [frameCount, getFrameSrc, scrollRootRef])

  useEffect(() => {
    let isMounted = true
    let cursor = 1
    let active = 0
    const concurrency = 8

    const runNext = () => {
      if (!isMounted) {
        return
      }

      while (active < concurrency && cursor <= frameCount) {
        const frame = cursor
        cursor += 1
        active += 1

        preloadImage(getFrameSrc(frame))
          .then(() => {
            if (frame === frameRef.current) {
              drawFrame(frame)
            }
          })
          .catch(() => undefined)
          .finally(() => {
            active -= 1
            runNext()
          })
      }
    }

    runNext()

    return () => {
      isMounted = false
    }
  }, [frameCount, getFrameSrc])

  return (
    <div ref={rootRef} className={className}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={alt}
        className="block h-full w-full"
      />
    </div>
  )
}
