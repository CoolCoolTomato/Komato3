import { useEffect, useMemo, useRef } from "react"

export type HackTransitionPhase = "idle" | "exiting" | "entering"

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 999.923) * 10000
  return x - Math.floor(x)
}

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

function getEdgeLines() {
  return Array.from({ length: 42 }, (_, index) => {
    const side = index % 4
    const a = pseudoRandom(index + 10)
    const b = pseudoRandom(index + 20)
    const c = pseudoRandom(index + 30)
    const d = pseudoRandom(index + 40)

    const isLong = index % 5 === 0
    const isMedium = index % 3 === 0

    if (side === 0) {
      const y = 6 + a * 88
      const length = isLong ? 48 + b * 34 : isMedium ? 26 + b * 36 : 12 + b * 26

      return {
        x1: -18 - d * 12,
        y1: y,
        x2: clamp(length, 8, 92),
        y2: y,
        shiftX: -24,
        shiftY: 0,
        dash: 28 + b * 52,
        opacity: 0.28 + c * 0.48,
      }
    }

    if (side === 1) {
      const y = 6 + a * 88
      const length = isLong ? 48 + b * 34 : isMedium ? 26 + b * 36 : 12 + b * 26

      return {
        x1: 118 + d * 12,
        y1: y,
        x2: clamp(100 - length, 8, 92),
        y2: y,
        shiftX: 24,
        shiftY: 0,
        dash: 28 + b * 52,
        opacity: 0.28 + c * 0.48,
      }
    }

    if (side === 2) {
      const x = index % 2 === 0 ? 5 + b * 35 : 60 + b * 35
      const length = isLong ? 42 + c * 38 : isMedium ? 24 + c * 34 : 10 + c * 28

      return {
        x1: x,
        y1: -16 - d * 10,
        x2: x,
        y2: clamp(length, 8, 92),
        shiftX: 0,
        shiftY: -22,
        dash: 26 + c * 48,
        opacity: 0.24 + b * 0.46,
      }
    }

    const x = index % 2 === 0 ? 5 + b * 35 : 60 + b * 35
    const length = isLong ? 42 + c * 38 : isMedium ? 24 + c * 34 : 10 + c * 28

    return {
      x1: x,
      y1: 116 + d * 10,
      x2: x,
      y2: clamp(100 - length, 8, 92),
      shiftX: 0,
      shiftY: 22,
      dash: 26 + c * 48,
      opacity: 0.24 + b * 0.46,
    }
  })
}

const circleEnterDelay = 0.32

function delayedProgress(value: number, delay: number) {
  if (value <= delay) return 0
  return clamp((value - delay) / (1 - delay), 0, 1)
}

function getOverlayValues({
  activeAnchor,
  fromAnchor,
  toAnchor,
  phase,
  transitionProgress,
}: {
  activeAnchor: number
  fromAnchor: number
  toAnchor: number
  phase: HackTransitionPhase
  transitionProgress: number
}) {
  const moving = phase !== "idle" && fromAnchor !== toAnchor
  const t = moving ? clamp(transitionProgress, 0, 1) : 1

  if (!moving) {
    return {
      codeRainOpacity: activeAnchor === 0 ? 0.38 : 0,
      codeRainDissolveProgress: activeAnchor === 0 ? 0 : 1,
      circleProgress: activeAnchor === 1 ? 1 : 0,
      edgeLineProgress: activeAnchor === 2 ? 1 : 0,
    }
  }

  const codeRainFrom = fromAnchor === 0 ? 1 : 0
  const codeRainTo = toAnchor === 0 ? 1 : 0
  const codeRainPresence = codeRainFrom + (codeRainTo - codeRainFrom) * t

  let circleProgress = 0
  let edgeLineProgress = 0

  if (fromAnchor === 1 && toAnchor !== 1) {
    circleProgress = 1 - t
  } else if (fromAnchor !== 1 && toAnchor === 1) {
    circleProgress = delayedProgress(t, circleEnterDelay)
  } else if (fromAnchor === 1 && toAnchor === 1) {
    circleProgress = 1
  }

  if (fromAnchor === 2 && toAnchor !== 2) {
    edgeLineProgress = 1 - t
  } else if (fromAnchor !== 2 && toAnchor === 2) {
    edgeLineProgress = t
  } else if (fromAnchor === 2 && toAnchor === 2) {
    edgeLineProgress = 1
  }

  return {
    codeRainOpacity: clamp(0.38 * codeRainPresence, 0, 1),
    codeRainDissolveProgress: clamp(1 - codeRainPresence, 0, 1),
    circleProgress: clamp(circleProgress, 0, 1),
    edgeLineProgress: clamp(edgeLineProgress, 0, 1),
  }
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

function CodeRainCanvas({
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

      // color

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

        const gradient = ctx.createLinearGradient(0, -bandHeight / 2, 0, bandHeight / 2)

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

export function HackTransitionOverlay({
  activeAnchor,
  fromAnchor,
  toAnchor,
  phase,
  transitionProgress,
}: {
  activeAnchor: number
  fromAnchor: number
  toAnchor: number
  phase: HackTransitionPhase
  transitionProgress: number
}) {
  const edgeLines = useMemo(() => getEdgeLines(), [])

  const {
    codeRainOpacity,
    codeRainDissolveProgress,
    circleProgress,
    edgeLineProgress,
  } = getOverlayValues({
    activeAnchor,
    fromAnchor,
    toAnchor,
    phase,
    transitionProgress,
  })

  const circleRadius = 46
  const circleLength = Math.PI * 2 * circleRadius
  const circleDashOffset = circleLength * (1 - circleProgress)

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>
        {`
          @keyframes hack-overlay-pulse {
            0%, 100% {
              opacity: 0.65;
            }

            50% {
              opacity: 1;
            }
          }

          @keyframes hack-circle-stroke-breathe {
            0%, 100% {
              stroke-width: 1.4;
              opacity: 0.2;
            }

            50% {
              stroke-width: 3.2;
              opacity: 0.5;
            }
          }
        `}
      </style>

      <CodeRainCanvas
        opacity={codeRainOpacity}
        dissolveProgress={codeRainDissolveProgress}
      />

      <div
        className="absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "clamp(280px, min(58vw, 68svh), 620px)",
          opacity: clamp(circleProgress * 1.25, 0, 1),
        }}
      >
        <svg
          className="h-full w-full overflow-visible"
          viewBox="0 0 100 100"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <filter id="hack-circle-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            cx="50"
            cy="50"
            r={circleRadius}
            stroke="rgba(255, 63, 50, 0.24)"
            strokeWidth="2.2"
            strokeDasharray={circleLength}
            strokeDashoffset={circleDashOffset}
            strokeLinecap="round"
            filter="url(#hack-circle-glow)"
            style={{
              animation:
                circleProgress > 0.96
                  ? "hack-circle-stroke-breathe 2.4s ease-in-out infinite"
                  : "none",
              transition: phase === "idle" ? "stroke-dashoffset 220ms ease" : "none",
            }}
          />

          <circle
            cx="50"
            cy="50"
            r={circleRadius}
            stroke="#ff3f32"
            strokeWidth="0.7"
            strokeDasharray={circleLength}
            strokeDashoffset={circleDashOffset}
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0 0 10px rgba(255, 63, 50, 0.78))",
              transition: phase === "idle" ? "stroke-dashoffset 220ms ease" : "none",
            }}
          />

          <circle
            cx="50"
            cy="50"
            r="1.15"
            fill="#ff3f32"
            style={{
              opacity: circleProgress > 0 && circleProgress < 1 ? 1 : 0,
              offsetPath: `path("M 96 50 A 46 46 0 1 1 95.99 49.99")`,
              offsetDistance: `${circleProgress * 100}%`,
              animation: "hack-overlay-pulse 920ms ease-in-out infinite",
              filter: "drop-shadow(0 0 12px rgba(255, 63, 50, 0.9))",
            }}
          />
        </svg>
      </div>

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
        style={{
          opacity: clamp(edgeLineProgress * 1.15, 0, 1),
          WebkitMaskImage:
            "radial-gradient(circle at center, transparent 0 25%, rgba(0,0,0,0.18) 36%, #000 58%)",
          maskImage:
            "radial-gradient(circle at center, transparent 0 25%, rgba(0,0,0,0.18) 36%, #000 58%)",
        }}
      >
        {edgeLines.map((line, index) => {
          const p = edgeLineProgress
          const translateX = line.shiftX * (1 - p)
          const translateY = line.shiftY * (1 - p)

          return (
            <g
              key={index}
              transform={`translate(${translateX} ${translateY})`}
              opacity={line.opacity}
            >
              <line
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={index % 5 === 0 ? "rgba(236, 246, 240, 0.7)" : "#ff3f32"}
                strokeWidth={index % 5 === 0 ? 0.11 : 0.16}
                strokeDasharray={line.dash}
                strokeDashoffset={line.dash * (1 - p)}
                strokeLinecap="round"
                style={{
                  filter:
                    index % 5 === 0
                      ? "drop-shadow(0 0 5px rgba(236, 246, 240, 0.28))"
                      : "drop-shadow(0 0 8px rgba(255, 63, 50, 0.48))",
                }}
              />

              {index % 3 === 0 ? (
                <circle
                  cx={line.x2}
                  cy={line.y2}
                  r="0.35"
                  fill="#ff3f32"
                  opacity={p}
                  style={{
                    filter: "drop-shadow(0 0 6px rgba(255, 63, 50, 0.7))",
                  }}
                />
              ) : null}
            </g>
          )
        })}
      </svg>
    </div>
  )
}