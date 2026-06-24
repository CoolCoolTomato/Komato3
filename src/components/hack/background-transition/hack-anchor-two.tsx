import { clamp, type HackTransitionPhase } from "./shared"

export function HackAnchorTwo({
  circleProgress,
  phase,
}: {
  circleProgress: number
  phase: HackTransitionPhase
}) {
  const circleRadius = 46
  const circleLength = Math.PI * 2 * circleRadius
  const circleDashOffset = circleLength * (1 - circleProgress)

  return (
    <div
      className="absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2"
      style={{
        width: "clamp(320px, min(58vw, 68svh), 620px)",
        opacity: clamp(circleProgress * 1.25, 0, 1),
      }}
    >
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
  )
}