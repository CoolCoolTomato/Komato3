import { useId, type CSSProperties } from "react"

type WordVariant = "strong" | "soft"

type WordLine = {
  text: string
  variant?: WordVariant
}

const leftLines: WordLine[] = [
  { text: "CYBER", variant: "strong" },
  { text: "SECURITY", variant: "strong" },
  { text: "PENETRATION", variant: "soft" },
  { text: "TESTING", variant: "soft" },
]

const rightLines: WordLine[] = [
  { text: "EXPLOIT", variant: "strong" },
  { text: "OFFENSIVE", variant: "strong" },
  { text: "FULL STACK", variant: "soft" },
  { text: "RESEARCH", variant: "soft" },
]

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ")
}

function GlitchWord({
  text,
  variant = "strong",
}: {
  text: string
  variant?: WordVariant
}) {
  const isWide = text.length >= 8 || text.includes(" ")

  return (
    <span className="hack-wordRow">
      <span
        className={cx(
          "hack-word",
          variant === "soft" ? "hack-word--soft" : "hack-word--strong",
          isWide && "hack-word--wide",
        )}
        data-text={text}
      >
        {text}
      </span>
    </span>
  )
}

function CopyBlock({
  side,
  lines,
  desc,
}: {
  side: "left" | "right"
  lines: WordLine[]
  desc: string
}) {
  return (
    <aside
      className={cx(
        "hack-copyBlock",
        side === "left" ? "hack-copyBlock--left" : "hack-copyBlock--right",
      )}
    >

      <div className="hack-copyBlock__words">
        {lines.map((line) => (
          <GlitchWord key={line.text} text={line.text} variant={line.variant} />
        ))}
      </div>

      <p className="hack-copyBlock__desc">{desc}</p>
    </aside>
  )
}

export function HackSectionTwo() {
  const warpId = useId().replace(/:/g, "")

  return (
    <section
      className="hack-section-two h-svh w-full"
      aria-label="Hack section two"
      style={
        {
          "--hack-tv-filter": `url(#${warpId})`,
        } as CSSProperties
      }
    >
      <svg className="hack-svg-filter" aria-hidden="true">
        <filter
          id={warpId}
          x="-28%"
          y="-28%"
          width="156%"
          height="156%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.014 0.18"
            numOctaves="1"
            seed="8"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="420ms"
              values="0.014 0.18;0.032 0.26;0.008 0.14;0.024 0.22"
              repeatCount="indefinite"
            />
          </feTurbulence>

          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="9"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <div className="hack-section-two__layout">
        <CopyBlock
          side="left"
          lines={leftLines}
          desc="Discovering vulnerabilities, hardening systems, and exploring offensive security through practical testing."
        />

        <div className="hack-section-two__safe" aria-hidden="true" />

        <CopyBlock
          side="right"
          lines={rightLines}
          desc="Offensive security research across exploits, systems, and full-stack applications."
        />
      </div>

      <style>{`
        .hack-section-two {
          --hack-red: #ff3f32;
          --hack-center-safe: min(44vw, 820px);

          position: relative;
          overflow: hidden;
          background: transparent;
          pointer-events: none;
        }

        .hack-svg-filter {
          position: absolute;
          width: 0;
          height: 0;
          pointer-events: none;
        }

        .hack-section-two__layout {
          position: relative;
          z-index: 2;
          display: grid;
          height: 100%;
          width: 100%;
          grid-template-columns: minmax(0, 1fr) var(--hack-center-safe) minmax(0, 1fr);
        }

        .hack-section-two__safe {
          grid-column: 2;
          pointer-events: none;
        }

        .hack-copyBlock {
          position: relative;
          align-self: center;
          min-width: 0;
          overflow: visible;
          isolation: isolate;
          pointer-events: auto;
          color: var(--hack-red);
          padding-block: clamp(22px, 2.6vw, 46px);
        }

        .hack-copyBlock--left {
          grid-column: 1;
          padding-left: clamp(20px, 4.2vw, 78px);
          padding-right: clamp(10px, 1.4vw, 28px);
          text-align: left;
        }

        .hack-copyBlock--right {
          grid-column: 3;
          padding-left: clamp(10px, 1.4vw, 28px);
          padding-right: clamp(20px, 4.2vw, 78px);
          text-align: right;
        }

        .hack-copyBlock__kicker {
          margin: 0 0 clamp(12px, 1.4vw, 24px);
          font-size: clamp(0.68rem, 0.72vw, 0.9rem);
          line-height: 1.1;
          letter-spacing: 0.28em;
          color: rgba(255, 255, 255, 0.52);
          text-transform: uppercase;
        }

        .hack-copyBlock__words {
          display: block;
          overflow: visible;
        }

        /**
         * 关键点：
         * hack-wordRow 是一整行布局；
         * hack-word 是 inline-block；
         * hover 只绑定在 hack-word 上，所以触发范围就是文字本身。
         */
        .hack-wordRow {
          display: block;
          overflow: visible;
          pointer-events: none;
        }

        .hack-word {
          position: relative;
          display: inline-block;
          max-width: 100%;
          padding-block: 0.035em 0.075em;
          white-space: nowrap;
          font-family:
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.072em;
          line-height: 0.9;
          color: rgba(255, 63, 50, 0.86);
          text-shadow:
            0 0 12px rgba(255, 63, 50, 0.34),
            0 0 30px rgba(255, 63, 50, 0.16);
          transform-origin: center;
          overflow: visible;
          pointer-events: auto;
          will-change: transform, filter, opacity;
        }

        .hack-word--strong {
          font-size: clamp(3.45rem, 6.6vw, 8.6rem);
        }

        .hack-word--soft {
          font-size: clamp(1.9rem, 3.9vw, 5.2rem);
          letter-spacing: -0.055em;
          color: rgba(255, 63, 50, 0.58);
        }

        .hack-word--wide {
          font-size: clamp(1.62rem, 3.35vw, 4.7rem);
          letter-spacing: -0.042em;
        }

        .hack-word::before,
        .hack-word::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          mix-blend-mode: screen;
        }

        .hack-word::before {
          color: rgba(255, 255, 255, 0.74);
          text-shadow:
            -2px 0 rgba(255, 255, 255, 0.6),
            2px 0 rgba(255, 63, 50, 0.9);
          clip-path: inset(0 0 54% 0);
        }

        .hack-word::after {
          color: rgba(255, 63, 50, 0.9);
          text-shadow:
            2px 0 rgba(0, 255, 194, 0.26),
            -3px 0 rgba(255, 255, 255, 0.2);
          clip-path: inset(46% 0 0 0);
        }

        .hack-word:hover {
          animation:
            hack-main-jitter-burst 1850ms steps(2, end) infinite,
            hack-filter-burst 1850ms steps(1, end) infinite;
        }

        .hack-word:hover::before {
          animation: hack-glitch-upper-burst 1850ms steps(2, end) infinite;
        }

        .hack-word:hover::after {
          animation: hack-glitch-lower-burst 1850ms steps(2, end) infinite;
        }

        .hack-word:hover {
          color: rgba(255, 63, 50, 0.96);
        }

        .hack-copyBlock__desc {
          max-width: 31ch;
          margin: clamp(18px, 1.8vw, 28px) 0 0;
          font-size: clamp(0.72rem, 0.9vw, 1rem);
          line-height: 1.65;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.42);
        }

        .hack-copyBlock--right .hack-copyBlock__desc {
          margin-left: auto;
        }

        .hack-word:hover ~ * {
          pointer-events: none;
        }
        
        @keyframes hack-filter-burst {
          0%,
          5%,
          9%,
          14%,
          19%,
          24% {
            filter: var(--hack-tv-filter);
          }

          25%,
          100% {
            filter: none;
          }
        }

        @keyframes hack-main-jitter-burst {
          0% {
            transform: translate3d(0, 0, 0) skewX(0deg);
            opacity: 1;
          }

          4% {
            transform: translate3d(-2px, 1px, 0) skewX(-2.5deg);
            opacity: 0.92;
          }

          8% {
            transform: translate3d(3px, -1px, 0) skewX(2deg);
            opacity: 1;
          }

          12% {
            transform: translate3d(-6px, 0, 0) skewX(-6deg);
            opacity: 0.82;
          }

          16% {
            transform: translate3d(4px, 1px, 0) skewX(3deg);
            opacity: 0.96;
          }

          20% {
            transform: translate3d(5px, -1px, 0) skewX(4deg);
            opacity: 0.86;
          }

          24% {
            transform: translate3d(0, 0, 0) skewX(0deg);
            opacity: 1;
          }

          25%,
          100% {
            transform: translate3d(0, 0, 0) skewX(0deg);
            opacity: 1;
          }
        }

        @keyframes hack-glitch-upper-burst {
          0% {
            opacity: 0;
            clip-path: inset(0 0 72% 0);
            transform: translate3d(0, 0, 0);
          }

          4% {
            opacity: 0.9;
            clip-path: inset(0 0 72% 0);
            transform: translate3d(-2px, 0, 0);
          }

          8% {
            opacity: 0.85;
            clip-path: inset(12% 0 48% 0);
            transform: translate3d(6px, -1px, 0);
          }

          12% {
            opacity: 0.92;
            clip-path: inset(4% 0 82% 0);
            transform: translate3d(-8px, 1px, 0);
          }

          16% {
            opacity: 0.78;
            clip-path: inset(26% 0 42% 0);
            transform: translate3d(4px, 0, 0);
          }

          20% {
            opacity: 0.9;
            clip-path: inset(0 0 64% 0);
            transform: translate3d(-4px, -1px, 0);
          }

          24% {
            opacity: 0;
            clip-path: inset(8% 0 76% 0);
            transform: translate3d(0, 0, 0);
          }

          25%,
          100% {
            opacity: 0;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes hack-glitch-lower-burst {
          0% {
            opacity: 0;
            clip-path: inset(64% 0 0 0);
            transform: translate3d(0, 0, 0);
          }

          4% {
            opacity: 0.82;
            clip-path: inset(64% 0 0 0);
            transform: translate3d(3px, 0, 0);
          }

          8% {
            opacity: 0.74;
            clip-path: inset(42% 0 18% 0);
            transform: translate3d(-7px, 1px, 0);
          }

          12% {
            opacity: 0.86;
            clip-path: inset(82% 0 4% 0);
            transform: translate3d(8px, -1px, 0);
          }

          16% {
            opacity: 0.72;
            clip-path: inset(52% 0 22% 0);
            transform: translate3d(-4px, 0, 0);
          }

          20% {
            opacity: 0.84;
            clip-path: inset(70% 0 0 0);
            transform: translate3d(5px, 1px, 0);
          }

          24% {
            opacity: 0;
            clip-path: inset(58% 0 12% 0);
            transform: translate3d(0, 0, 0);
          }

          25%,
          100% {
            opacity: 0;
            transform: translate3d(0, 0, 0);
          }
        }

        @media (max-width: 900px) {
          .hack-section-two {
            --hack-center-safe: 1fr;
          }

          .hack-section-two__layout {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr auto;
            padding: 6svh 18px;
          }

          .hack-section-two__safe {
            grid-column: 1;
            grid-row: 2;
            min-height: 42svh;
          }

          .hack-copyBlock {
            padding: 0;
          }

          .hack-copyBlock--left {
            grid-column: 1;
            grid-row: 1;
            align-self: start;
            text-align: left;
            transform: translateY(-2svh);
          }

          .hack-copyBlock--right {
            grid-column: 1;
            grid-row: 3;
            align-self: end;
            text-align: right;
            transform: translateY(-6svh);
          }

          .hack-word--strong {
            font-size: clamp(3rem, 14.5vw, 5.8rem);
          }

          .hack-word--soft,
          .hack-word--wide {
            font-size: clamp(1.55rem, 8.2vw, 3.2rem);
          }

          .hack-copyBlock__desc {
            max-width: 28ch;
            font-size: 0.68rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hack-word,
          .hack-word::before,
          .hack-word::after {
            animation: none !important;
          }

          .hack-word:hover {
            filter: none;
          }
        }
      `}</style>
    </section>
  )
}