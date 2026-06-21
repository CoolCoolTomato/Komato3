import { useEffect, useRef, useState } from "react"

import { HackerBackground } from "@/components/hack/hacker-background"

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

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

      const rootTop = root.getBoundingClientRect().top + window.scrollY
      const scrollableDistance = Math.max(root.offsetHeight - window.innerHeight, 1)
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

export function HackModePage() {
  const rootRef = useRef<HTMLElement>(null)
  const progress = usePageProgress(rootRef)

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
