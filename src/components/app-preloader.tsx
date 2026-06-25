import { useEffect, useMemo, useState, type ReactNode } from "react"

import nightEnvironmentUrl from "@/assets/dikhololo_night_1k.hdr?url"
import { preloadImage } from "@/lib/image-cache"

const minimumSplashDuration = 2400
const preloadConcurrency = 10
const exitAnimationDuration = 760
const exitAnimationBuffer = 120
const tomatoFrameCount = 137

type AppPreloaderProps = {
  children: ReactNode
}

type PreloadState = {
  loaded: number
  total: number
  failed: string[]
}

const getTomatoFrameSrc = (frame: number) =>
  `/frames-tomato/frame_${frame.toString().padStart(4, "0")}.webp`

const imageAssets = [
  "/2022.png",
  "/2023.png",
  "/2024.png",
  "/2025.png",
  "/2026.png",
  "/blog.png",
  ...Array.from({ length: tomatoFrameCount }, (_, index) =>
    getTomatoFrameSrc(index + 1),
  ),
]

const fetchAssets = ["/tomato.glb", nightEnvironmentUrl]

const preloadAssets = [...imageAssets, ...fetchAssets]

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
  if (imageAssets.includes(src)) {
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

export function AppPreloader({ children }: AppPreloaderProps) {
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

    setTargetProgress(Math.min(realProgress, 92))
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

        const step = Math.max(1, Math.ceil(distance * 0.08))
        return Math.min(current + step, targetProgress)
      })
    }, 28)

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
          className="fixed inset-0 z-[10000] grid h-svh place-items-center overflow-hidden bg-white text-[#ff3f32]"
          style={{
            transform: isExiting
              ? "translate3d(0, -100%, 0)"
              : "translate3d(0, 0, 0)",
            opacity: isExiting ? 0.96 : 1,
            filter: isExiting ? "blur(1px)" : "blur(0)",
            transition:
              "transform 760ms cubic-bezier(0.76, 0, 0.24, 1), opacity 760ms ease, filter 760ms ease",
            willChange: "transform, opacity, filter",
          }}
        >
          <p
            className="text-[clamp(3.5rem,16vw,9rem)] font-black leading-none tracking-[-0.08em]"
            style={{
              transform: isExiting
                ? "translate3d(0, -2rem, 0)"
                : "translate3d(0, 0, 0)",
              opacity: isExiting ? 0 : 1,
              transition:
                "transform 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease",
              willChange: "transform, opacity",
            }}
          >
            {displayProgress}%
          </p>
        </main>
      ) : null}
    </>
  )
}
