import { useEffect, useMemo, useState, type ReactNode } from "react"

import { hackFetchAssets, hackImageAssets } from "@/components/hack/hack-assets"
import { preloadImage } from "@/lib/image-cache"

const minimumSplashDuration = 1800
const preloadConcurrency = 6
const exitAnimationDuration = 820
const exitAnimationBuffer = 120

const preloadAssets = [...hackImageAssets, ...hackFetchAssets]

type HackPreloaderProps = {
  children: ReactNode
}

type PreloadState = {
  loaded: number
  total: number
  failed: string[]
}

let preloadPromise: Promise<string[]> | null = null
let preloadProgress = {
  loaded: 0,
  failed: [] as string[],
}

function wait(duration: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration)
  })
}

async function preloadFetchAsset(src: string) {
  const response = await fetch(src, { cache: "force-cache" })

  if (!response.ok) {
    throw new Error(`Failed to load ${src}`)
  }

  await response.blob()
}

async function preloadAsset(src: string) {
  if (hackImageAssets.includes(src)) {
    await preloadImage(src)
    return
  }

  await preloadFetchAsset(src)
}

function startPreloading(onProgress: (failedAsset?: string) => void) {
  if (preloadPromise) {
    return preloadPromise
  }

  preloadProgress = {
    loaded: 0,
    failed: [],
  }

  preloadPromise = new Promise<string[]>((resolve) => {
    let cursor = 0
    let active = 0

    const runNext = () => {
      if (cursor >= preloadAssets.length && active === 0) {
        resolve(preloadProgress.failed)
        return
      }

      while (active < preloadConcurrency && cursor < preloadAssets.length) {
        const asset = preloadAssets[cursor]
        cursor += 1
        active += 1

        preloadAsset(asset)
          .catch(() => {
            preloadProgress.failed.push(asset)
            return asset
          })
          .then((failedAsset) => {
            preloadProgress.loaded += 1
            onProgress(typeof failedAsset === "string" ? failedAsset : undefined)
          })
          .finally(() => {
            active -= 1
            runNext()
          })
      }
    }

    runNext()
  })

  return preloadPromise
}

export function HackPreloader({ children }: HackPreloaderProps) {
  const [state, setState] = useState<PreloadState>(() => ({
    loaded: preloadProgress.loaded,
    total: preloadAssets.length,
    failed: preloadProgress.failed,
  }))

  const [displayProgress, setDisplayProgress] = useState(0)
  const [targetProgress, setTargetProgress] = useState(0)
  const [canEnter, setCanEnter] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [isOverlayVisible, setIsOverlayVisible] = useState(true)

  const realProgress = useMemo(() => {
    if (state.total === 0) {
      return 100
    }

    return Math.round((state.loaded / state.total) * 100)
  }, [state.loaded, state.total])

  useEffect(() => {
    let isMounted = true

    const updateProgress = () => {
      if (!isMounted) {
        return
      }

      setState((current) => ({
        ...current,
        loaded: preloadProgress.loaded,
        failed: [...preloadProgress.failed],
      }))
    }

    Promise.all([
      startPreloading(updateProgress),
      wait(minimumSplashDuration),
    ]).then(() => {
      if (!isMounted) {
        return
      }

      setState((current) => ({
        ...current,
        loaded: preloadAssets.length,
        total: preloadAssets.length,
        failed: [...preloadProgress.failed],
      }))

      setTargetProgress(100)
      setCanEnter(true)
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (canEnter) {
      setTargetProgress(100)
      return
    }

    setTargetProgress(Math.min(realProgress, 94))
  }, [realProgress, canEnter])

  useEffect(() => {
    if (displayProgress >= targetProgress) {
      return
    }

    const timer = window.setTimeout(() => {
      setDisplayProgress((current) => {
        const distance = targetProgress - current

        if (distance <= 0) {
          return current
        }

        const step = Math.max(1, Math.ceil(distance * 0.1))
        return Math.min(current + step, targetProgress)
      })
    }, 26)

    return () => {
      window.clearTimeout(timer)
    }
  }, [displayProgress, targetProgress])

  useEffect(() => {
    if (!canEnter || displayProgress < 100 || isExiting) {
      return
    }

    setIsExiting(true)

    const timer = window.setTimeout(() => {
      setIsOverlayVisible(false)
    }, exitAnimationDuration + exitAnimationBuffer)

    return () => {
      window.clearTimeout(timer)
    }
  }, [canEnter, displayProgress, isExiting])

  useEffect(() => {
    if (!isOverlayVisible) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOverlayVisible])

  return (
    <>
      {children}

      {isOverlayVisible ? (
        <main
          className="fixed inset-0 z-[10000] grid h-svh place-items-center overflow-hidden bg-[#050706] text-[#ff3f32]"
          style={{
            transform: isExiting
              ? "translate3d(0, -100%, 0)"
              : "translate3d(0, 0, 0)",
            opacity: isExiting ? 0.96 : 1,
            filter: isExiting ? "blur(1.5px) saturate(1.5)" : "blur(0) saturate(1)",
            transition:
              "transform 820ms cubic-bezier(0.76, 0, 0.24, 1), opacity 820ms ease, filter 820ms ease",
            willChange: "transform, opacity, filter",
          }}
        >
          <div className="relative z-10 flex flex-col items-center gap-5">
            <p
              className="text-[clamp(3.5rem,16vw,9rem)] font-black leading-none tracking-[-0.08em] drop-shadow-[0_0_24px_rgba(255,63,50,0.28)]"
              style={{
                transform: isExiting
                  ? "translate3d(0, -2rem, 0)"
                  : "translate3d(0, 0, 0)",
                opacity: isExiting ? 0 : 1,
                filter: isExiting ? "blur(4px)" : "blur(0)",
                transition:
                  "transform 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease, filter 500ms ease",
                willChange: "transform, opacity, filter",
              }}
            >
              {displayProgress}%
            </p>
          </div>
        </main>
      ) : null}
    </>
  )
}
