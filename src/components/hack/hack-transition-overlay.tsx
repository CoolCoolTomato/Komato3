import { useMemo } from "react"

export type HackTransitionPhase = "idle" | "exiting" | "entering"

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 999.923) * 10000
  return x - Math.floor(x)
}

function getCodeRainColumns() {
  const tokens = [
    "01",
    "10",
    "root",
    "sudo",
    "ssh",
    "trace",
    "exec",
    "grep",
    "0xff",
    "/bin",
    "null",
    "sys",
    "tcp",
    "udp",
    "auth",
    "fork",
  ]

  return Array.from({ length: 20 }, (_, index) => {
    const left = 4 + pseudoRandom(index + 1) * 92
    const duration = 8 + pseudoRandom(index + 7) * 8
    const delay = -pseudoRandom(index + 13) * 12
    const opacity = 0.3 + pseudoRandom(index + 19) * 0.34

    const text = Array.from({ length: 36 }, (_, lineIndex) => {
      const tokenIndex =
        (index * 5 + lineIndex * 3 + Math.floor(pseudoRandom(lineIndex + index) * 10)) %
        tokens.length

      return tokens[tokenIndex]
    }).join("\n")

    return {
      left,
      duration,
      delay,
      opacity,
      text,
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
      // left -> right, horizontal only
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
      // right -> left, horizontal only
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
      // top -> bottom, vertical only
      const x =
        index % 2 === 0
          ? 5 + b * 35
          : 60 + b * 35

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

    // bottom -> top, vertical only
    const x =
      index % 2 === 0
        ? 5 + b * 35
        : 60 + b * 35

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

const circleEnterDelay = 1

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

  let codeRainOpacity = 0
  let circleProgress = 0
  let edgeLineProgress = 0

  if (!moving) {
    if (activeAnchor === 0) {
      codeRainOpacity = 0.34
    }

    if (activeAnchor === 1) {
      circleProgress = 1
    }

    if (activeAnchor === 2) {
      edgeLineProgress = 1
    }

    return {
      codeRainOpacity,
      circleProgress,
      edgeLineProgress,
    }
  }

  const isOneToTwo = fromAnchor === 0 && toAnchor === 1
  const isTwoToOne = fromAnchor === 1 && toAnchor === 0
  const isTwoToThree = fromAnchor === 1 && toAnchor === 2
  const isThreeToTwo = fromAnchor === 2 && toAnchor === 1

  if (isOneToTwo) {
    const delayedCircleProgress = delayedProgress(t, circleEnterDelay)

    codeRainOpacity = 0.34 * (1 - t)
    circleProgress = delayedCircleProgress
  }

  if (isTwoToOne) {
    codeRainOpacity = 0.34 * t
    circleProgress = 1 - t
  }

  if (isTwoToThree) {
    circleProgress = 1 - t
    edgeLineProgress = t
  }

  if (isThreeToTwo) {
    const delayedCircleProgress = delayedProgress(t, circleEnterDelay)

    circleProgress = delayedCircleProgress
    edgeLineProgress = 1 - t
  }

  return {
    codeRainOpacity: clamp(codeRainOpacity, 0, 1),
    circleProgress: clamp(circleProgress, 0, 1),
    edgeLineProgress: clamp(edgeLineProgress, 0, 1),
  }
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
  const codeRainColumns = useMemo(() => getCodeRainColumns(), [])
  const edgeLines = useMemo(() => getEdgeLines(), [])

  const { codeRainOpacity, circleProgress, edgeLineProgress } = getOverlayValues({
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
          @keyframes hack-code-rain {
            0% {
              transform: translate3d(0, -115%, 0);
            }
            100% {
              transform: translate3d(0, 115%, 0);
            }
          }

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

      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          opacity: codeRainOpacity,
          WebkitMaskImage:
            "radial-gradient(circle at center, rgba(0,0,0,0.08) 0 22%, rgba(0,0,0,0.42) 40%, #000 100%)",
          maskImage:
            "radial-gradient(circle at center, rgba(0,0,0,0.08) 0 22%, rgba(0,0,0,0.42) 40%, #000 100%)",
        }}
      >
        {codeRainColumns.map((column, index) => (
          <pre
            key={index}
            className="absolute top-0 m-0 select-none whitespace-pre font-mono text-[10px] leading-[1.48] tracking-[0.18em]"
            style={{
              left: `${column.left}%`,
              color: column.isRed
                ? "rgba(255, 63, 50, 0.7)"
                : "rgba(226, 242, 232, 0.52)",
              opacity: column.opacity,
              textShadow: column.isRed
                ? "0 0 14px rgba(255, 63, 50, 0.55)"
                : "0 0 10px rgba(220, 255, 232, 0.28)",
              animation: `hack-code-rain ${column.duration}s linear infinite`,
              animationDelay: `${column.delay}s`,
            }}
          >
            {column.text}
          </pre>
        ))}
      </div>

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