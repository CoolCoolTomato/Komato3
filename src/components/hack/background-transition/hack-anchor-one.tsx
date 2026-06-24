import { useEffect, useRef } from "react"

import { clamp, pseudoRandom } from "./shared"

type CodeLightBand = {
  x: number
  width: number
  height: number
  duration: number
  delay: number
  opacity: number
  angle: number
  isRed: boolean
}

function getCodeLightBands() {
  const laneCount = 20

  return Array.from({ length: laneCount }, (_, index) => {
    const laneProgress = laneCount <= 1 ? 0 : index / (laneCount - 1)
    const jitter = (pseudoRandom(index + 101) - 0.5) * 0.045

    return {
      x: -0.08 + laneProgress * 1.16 + jitter,
      width: 0.045 + pseudoRandom(index + 111) * 0.045,
      height: 0.34 + pseudoRandom(index + 121) * 0.26,
      duration: 6.4 + pseudoRandom(index + 131) * 6.2,
      delay: -pseudoRandom(index + 141) * 12,
      opacity: 0.26 + pseudoRandom(index + 151) * 0.38,
      angle: index % 2 === 0 ? -4 : 4,
      isRed: index % 4 === 0,
    }
  })
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  return canvas
}

function clearCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

export function HackAnchorOne({
  opacity,
  dissolveProgress,
}: {
  opacity: number
  dissolveProgress: number
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const opacityRef = useRef(opacity)
  const dissolveRef = useRef(dissolveProgress)

  const startRef = useRef<(() => void) | null>(null)
  const stopRef = useRef<((clear?: boolean) => void) | null>(null)

  const stateRef = useRef<{
    width: number
    height: number
    dpr: number
    baseCanvas: HTMLCanvasElement
    glyphCanvas: HTMLCanvasElement
    greenMaskCanvas: HTMLCanvasElement
    redMaskCanvas: HTMLCanvasElement
    tempCanvas: HTMLCanvasElement
    bands: CodeLightBand[]
  } | null>(null)

  useEffect(() => {
    opacityRef.current = opacity

    if (opacity > 0.001) {
      startRef.current?.()
    } else {
      stopRef.current?.(true)
    }
  }, [opacity])

  useEffect(() => {
    dissolveRef.current = dissolveProgress
  }, [dissolveProgress])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const chars = [
      "0",
      "1",
      "{",
      "}",
      "[",
      "]",
      "(",
      ")",
      "<",
      ">",
      "/",
      "\\",
      "|",
      "-",
      "+",
      "=",
      "*",
      "#",
      "$",
      "@",
      "%",
      "&",
      "_",
      "~",
      ":",
      ";",
    ]

    const bands = getCodeLightBands()

    function stop(clear = false) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      if (clear) {
        const ctx = canvas.getContext("2d")

        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
    }

    function buildStaticLayer() {
      const rect = canvas.getBoundingClientRect()
      const width = Math.max(1, Math.ceil(rect.width || window.innerWidth))
      const height = Math.max(1, Math.ceil(rect.height || window.innerHeight))
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35)

      const pixelWidth = Math.ceil(width * dpr)
      const pixelHeight = Math.ceil(height * dpr)

      canvas.width = pixelWidth
      canvas.height = pixelHeight

      const baseCanvas = createCanvas(pixelWidth, pixelHeight)
      const glyphCanvas = createCanvas(pixelWidth, pixelHeight)
      const greenMaskCanvas = createCanvas(pixelWidth, pixelHeight)
      const redMaskCanvas = createCanvas(pixelWidth, pixelHeight)
      const tempCanvas = createCanvas(pixelWidth, pixelHeight)

      const baseCtx = baseCanvas.getContext("2d")
      const glyphCtx = glyphCanvas.getContext("2d")

      if (!baseCtx || !glyphCtx) {
        return
      }

      const fontSize = clamp(width * 0.0047, 7, 10.5)
      const cellWidth = fontSize * 1.55
      const cellHeight = fontSize * 1.48

      const cols = Math.ceil(width / cellWidth) + 12
      const rows = Math.ceil(height / cellHeight) + 12

      const startX = -cellWidth * 6
      const startY = -cellHeight * 6

      for (const ctx of [baseCtx, glyphCtx]) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, width, height)
        ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`
        ctx.textBaseline = "top"
      }

      baseCtx.fillStyle = "rgba(226, 242, 232, 0.1)"
      baseCtx.shadowColor = "rgba(226, 242, 232, 0.15)"
      baseCtx.shadowBlur = 4

      glyphCtx.fillStyle = "rgba(255, 255, 255, 0.92)"
      glyphCtx.shadowColor = "rgba(255, 255, 255, 0.45)"
      glyphCtx.shadowBlur = 6

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const seed =
            row * 91.731 +
            col * 37.217 +
            Math.floor(row / 4) * 13.13

          const charIndex = Math.floor(pseudoRandom(seed) * chars.length)
          const char = chars[charIndex]

          const x = startX + col * cellWidth
          const y = startY + row * cellHeight

          baseCtx.fillText(char, x, y)
          glyphCtx.fillText(char, x, y)
        }
      }

      stateRef.current = {
        width,
        height,
        dpr,
        baseCanvas,
        glyphCanvas,
        greenMaskCanvas,
        redMaskCanvas,
        tempCanvas,
        bands,
      }
    }

    function drawLightMask(
      maskCanvas: HTMLCanvasElement,
      colorType: "green" | "red",
      now: number,
    ) {
      const state = stateRef.current

      if (!state) {
        return
      }

      const ctx = maskCanvas.getContext("2d")

      if (!ctx) {
        return
      }

      const { width, height, dpr, bands } = state

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      for (const band of bands) {
        if (colorType === "red" && !band.isRed) continue
        if (colorType === "green" && band.isRed) continue

        const bandWidth = width * band.width
        const bandHeight = height * band.height

        const elapsed = now / 1000 + band.delay
        const rawProgress = elapsed / band.duration
        const progress = rawProgress - Math.floor(rawProgress)

        const x = width * band.x
        const y = -bandHeight + progress * (height + bandHeight * 2.2)

        ctx.save()
        ctx.globalAlpha = band.opacity
        ctx.translate(x, y)
        ctx.rotate((band.angle * Math.PI) / 180)

        const gradient = ctx.createLinearGradient(
          0,
          -bandHeight / 2,
          0,
          bandHeight / 2,
        )

        gradient.addColorStop(0, "rgba(0, 0, 0, 0)")
        gradient.addColorStop(0.18, "rgba(0, 0, 0, 0.04)")
        gradient.addColorStop(0.42, "rgba(0, 0, 0, 0.78)")
        gradient.addColorStop(0.52, "rgba(0, 0, 0, 1)")
        gradient.addColorStop(0.74, "rgba(0, 0, 0, 0.12)")
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

        ctx.fillStyle = gradient
        ctx.fillRect(-bandWidth / 2, -bandHeight / 2, bandWidth, bandHeight)

        ctx.restore()
      }
    }

    function drawTintedGlyphLayer(
      targetCtx: CanvasRenderingContext2D,
      maskCanvas: HTMLCanvasElement,
      color: string,
      glowColor: string,
    ) {
      const state = stateRef.current

      if (!state) {
        return
      }

      const tempCtx = state.tempCanvas.getContext("2d")

      if (!tempCtx) {
        return
      }

      const { tempCanvas, glyphCanvas } = state

      tempCtx.setTransform(1, 0, 0, 1, 0, 0)
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)

      tempCtx.globalCompositeOperation = "source-over"
      tempCtx.globalAlpha = 1
      tempCtx.drawImage(glyphCanvas, 0, 0)

      tempCtx.globalCompositeOperation = "source-in"
      tempCtx.fillStyle = color
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

      tempCtx.globalCompositeOperation = "destination-in"
      tempCtx.drawImage(maskCanvas, 0, 0)

      tempCtx.globalCompositeOperation = "source-over"

      targetCtx.save()
      targetCtx.shadowColor = glowColor
      targetCtx.shadowBlur = 12
      targetCtx.drawImage(tempCanvas, 0, 0)
      targetCtx.restore()
    }

    function render(now: number) {
      const state = stateRef.current
      const ctx = canvas.getContext("2d")

      if (!state || !ctx) {
        rafRef.current = null
        return
      }

      if (opacityRef.current <= 0.001) {
        stop(true)
        return
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.globalCompositeOperation = "source-over"
      ctx.globalAlpha = 1
      ctx.drawImage(state.baseCanvas, 0, 0)

      drawLightMask(state.greenMaskCanvas, "green", now)
      drawLightMask(state.redMaskCanvas, "red", now)

      drawTintedGlyphLayer(
        ctx,
        state.greenMaskCanvas,
        "rgba(226, 242, 232, 0.66)",
        "rgba(226, 242, 232, 0.28)",
      )

      drawTintedGlyphLayer(
        ctx,
        state.redMaskCanvas,
        "rgba(255, 63, 50, 0.76)",
        "rgba(255, 63, 50, 0.44)",
      )

      rafRef.current = requestAnimationFrame(render)
    }

    function start() {
      if (rafRef.current !== null) {
        return
      }

      rafRef.current = requestAnimationFrame(render)
    }

    startRef.current = start
    stopRef.current = stop

    buildStaticLayer()

    if (opacityRef.current > 0.001) {
      start()
    }

    const resizeObserver = new ResizeObserver(() => {
      buildStaticLayer()

      if (opacityRef.current > 0.001) {
        start()
      }
    })

    resizeObserver.observe(canvas)

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop(false)
      } else if (opacityRef.current > 0.001) {
        start()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      resizeObserver.disconnect()
      document.removeEventListener("visibilitychange", handleVisibilityChange)

      stop(true)

      const state = stateRef.current

      if (state) {
        clearCanvas(state.baseCanvas)
        clearCanvas(state.glyphCanvas)
        clearCanvas(state.greenMaskCanvas)
        clearCanvas(state.redMaskCanvas)
        clearCanvas(state.tempCanvas)
      }

      stateRef.current = null
      startRef.current = null
      stopRef.current = null
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full mix-blend-screen"
      style={{
        opacity,
        transform: `scale(${1 + dissolveProgress * 0.018})`,
        filter: `blur(${dissolveProgress * 2.4}px) saturate(${
          1 + dissolveProgress * 0.38
        })`,
        willChange: "opacity, filter, transform",
        WebkitMaskImage:
          "radial-gradient(ellipse clamp(220px, 31vw, 540px) clamp(280px, 50svh, 660px) at 50% 53%, transparent 0 55%, rgba(0,0,0,0.06) 67%, rgba(0,0,0,0.72) 82%, #000 100%)",
        maskImage:
          "radial-gradient(ellipse clamp(220px, 31vw, 540px) clamp(280px, 50svh, 660px) at 50% 53%, transparent 0 55%, rgba(0,0,0,0.06) 67%, rgba(0,0,0,0.72) 82%, #000 100%)",
      }}
      aria-hidden="true"
    />
  )
}