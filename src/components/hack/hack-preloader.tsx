import { useEffect, useMemo, useState, type ReactNode } from "react"

import { hackFetchAssets, hackImageAssets } from "@/components/hack/hack-assets"
import { preloadImage } from "@/lib/image-cache"

const minimumSplashDuration = 1800
const preloadConcurrency = 6

const preloadAssets = [...hackImageAssets, ...hackFetchAssets]

type HackPreloaderProps = {
  children: ReactNode
}

type PreloadState = {
  loaded: number
  total: number
  failed: string[]
  isComplete: boolean
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
    if (!canEnter || displayProgress < 100) {
      return
    }

    const timer = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        isComplete: true,
      }))
    }, 220)

    return () => {
      window.clearTimeout(timer)
    }
  }, [canEnter, displayProgress])

  if (state.isComplete) {
    return children
  }

  return (
    <main className="relative grid h-svh place-items-center overflow-hidden bg-[#050706] text-[#ff3f32]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-x-0 top-0 h-24 border-b border-[#ff3f32]/20" />
        <div className="absolute inset-x-0 bottom-0 h-24 border-t border-[#ff3f32]/20" />
        <div className="absolute left-0 top-0 h-full w-8 border-r border-[#ff3f32]/20 md:w-16" />
        <div className="absolute right-0 top-0 h-full w-8 border-l border-[#ff3f32]/20 md:w-16" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,63,50,0.06)_1px,transparent_1px)] bg-[length:100%_18px] opacity-30" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5">
        <p className="text-[clamp(3.5rem,16vw,9rem)] font-black leading-none tracking-[-0.08em] drop-shadow-[0_0_24px_rgba(255,63,50,0.28)]">
          {displayProgress}%
        </p>
        <p className="text-xs font-black uppercase tracking-[0.34em] text-[#ff3f32]/65">
          Loading Hack Assets
        </p>
      </div>
    </main>
  )
}
