import { useEffect, useMemo, useState, type ReactNode } from "react"

import nightEnvironmentUrl from "@/assets/dikhololo_night_1k.hdr?url"
import { preloadImage } from "@/lib/image-cache"

const minimumSplashDuration = 2400
const preloadConcurrency = 10
const tomatoFrameCount = 137

type AppPreloaderProps = {
  children: ReactNode
}

type PreloadState = {
  loaded: number
  total: number
  failed: string[]
  isComplete: boolean
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
    isComplete: false,
  }))

  const [displayProgress, setDisplayProgress] = useState(0)
  const [targetProgress, setTargetProgress] = useState(0)
  const [canEnter, setCanEnter] = useState(false)

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
    if (!canEnter || displayProgress < 100) {
      return
    }

    const timer = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        isComplete: true,
      }))
    }, 250)

    return () => {
      window.clearTimeout(timer)
    }
  }, [canEnter, displayProgress])

  useEffect(() => {
    if (state.isComplete) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [state.isComplete])

  return (
    <>
      {children}

      {!state.isComplete ? (
        <main className="fixed inset-0 z-[10000] grid h-svh place-items-center overflow-hidden bg-white text-[#ff3f32]">
          <p className="text-[clamp(3.5rem,16vw,9rem)] font-black leading-none tracking-[-0.08em]">
            {displayProgress}%
          </p>
        </main>
      ) : null}
    </>
  )
}
