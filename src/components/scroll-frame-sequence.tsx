import { useEffect, useRef, useState } from "react"

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
  const [frame, setFrame] = useState(1)
  const progressRef = useRef(0)
  const targetProgressRef = useRef(0)
  const animationFrameRef = useRef<number | undefined>(undefined)

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

        setFrame(nextFrame)
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

        container.removeEventListener("scroll", updateFrameFromScroll)
        window.removeEventListener("resize", updateFrameFromScroll)
      }
    }

  }, [frameCount, scrollRootRef])

  useEffect(() => {
    const preloadFrames = [frame - 1, frame + 1].filter(
      (nextFrame) => nextFrame >= 1 && nextFrame <= frameCount,
    )

    preloadFrames.forEach((nextFrame) => {
      const image = new Image()
      image.src = getFrameSrc(nextFrame)
    })
  }, [frame, frameCount, getFrameSrc])

  return (
    <div ref={rootRef} className={className}>
      <img
        src={getFrameSrc(frame)}
        alt={alt}
        className="h-full w-full object-contain"
        draggable={false}
      />
    </div>
  )
}
