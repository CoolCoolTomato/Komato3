import type { CSSProperties } from "react"

type HackEntrySectionProps = {
  compactScrollSection?: boolean
}

type GlitchStyle = CSSProperties & Record<`--${string}`, string | number>

const textSlices = [
  { top: 8, bottom: 19, x: "-18px", delay: "-0.15s" },
  { top: 27, bottom: 36, x: "14px", delay: "-0.85s" },
  { top: 48, bottom: 57, x: "-24px", delay: "-1.3s" },
  { top: 68, bottom: 78, x: "20px", delay: "-0.55s" },
]

const colorBlocks = [
  {
    top: "14%",
    left: "7%",
    width: "24%",
    height: "18%",
    x: "-22px",
    delay: "-0.2s",
    color: "rgba(216, 255, 95, 0.3)",
  },
  {
    top: "34%",
    left: "66%",
    width: "26%",
    height: "16%",
    x: "20px",
    delay: "-0.9s",
    color: "rgba(70, 95, 255, 0.32)",
  },
  {
    top: "62%",
    left: "18%",
    width: "38%",
    height: "12%",
    x: "-28px",
    delay: "-1.45s",
    color: "rgba(255, 255, 255, 0.18)",
  },
]

function switchToHackMode() {
  window.localStorage.setItem("mode", "hack")
  window.location.reload()
}

export function HackEntrySection(_: HackEntrySectionProps) {
  const label = "Second Personality"

  return (
    <section className="relative h-[100px] min-h-[100px] w-full overflow-hidden bg-black text-white">
      <button
        type="button"
        onClick={switchToHackMode}
        data-scroll-snap-lock="true"
        className="hack-entry-panel group relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden text-center"
        aria-label="Second Personality"
      >
        <span aria-hidden="true" className="hack-entry-core" />

        {colorBlocks.map((block, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="hack-entry-color-block"
            style={
              {
                "--block-top": block.top,
                "--block-left": block.left,
                "--block-width": block.width,
                "--block-height": block.height,
                "--block-x": block.x,
                "--block-delay": block.delay,
                "--block-color": block.color,
              } as GlitchStyle
            }
          />
        ))}

        <span className="hack-entry-label" data-text={label}>
          {label}
        </span>

        {textSlices.map((slice, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="hack-entry-text-slice"
            style={
              {
                "--slice-top": `${slice.top}%`,
                "--slice-bottom": `${slice.bottom}%`,
                "--slice-x": slice.x,
                "--slice-delay": slice.delay,
              } as GlitchStyle
            }
          >
            {label}
          </span>
        ))}
      </button>

      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-x-0 top-0 border-t border-[#ff3f32]/45" />
        <div className="absolute inset-x-0 bottom-0 border-t border-[#ff3f32]/45" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,63,50,0.12)_1px,transparent_1px),linear-gradient(rgba(255,63,50,0.08)_1px,transparent_1px)] bg-[length:42px_100%,100%_12px]" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#ff3f32]/20 shadow-[0_0_18px_rgba(255,63,50,0.35)]" />
      </div>

      <style>{`
        .hack-entry-panel {
          isolation: isolate;
          background:
            radial-gradient(circle at 18% 50%, rgba(255, 63, 50, 0.14), transparent 28%),
            radial-gradient(circle at 82% 45%, rgba(216, 255, 95, 0.08), transparent 22%),
            #020202;
        }

        .hack-entry-core {
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent),
            #020202;
          box-shadow:
            inset 0 0 34px rgba(255, 63, 50, 0.08),
            inset 0 0 2px rgba(255, 255, 255, 0.18);
          animation: hack-entry-power 3.4s infinite steps(1);
        }

        .hack-entry-label,
        .hack-entry-text-slice {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-inline: 1.5rem;
          font-size: clamp(1.1rem, 4.2vw, 2.6rem);
          font-weight: 900;
          line-height: 1;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.93);
          text-shadow:
            0 0 20px rgba(255, 255, 255, 0.16),
            3px 0 rgba(216, 255, 95, 0.2),
            -3px 0 rgba(70, 95, 255, 0.22);
        }

        .hack-entry-label::before,
        .hack-entry-label::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          pointer-events: none;
          mix-blend-mode: screen;
        }

        .hack-entry-label::before {
          color: rgba(216, 255, 95, 0.72);
          transform: translateX(-7px);
          clip-path: inset(0 0 54% 0);
          animation: hack-entry-channel-a 2.2s infinite steps(1);
        }

        .hack-entry-label::after {
          color: rgba(70, 95, 255, 0.72);
          transform: translateX(7px);
          clip-path: inset(44% 0 0 0);
          animation: hack-entry-channel-b 2.5s infinite steps(1);
        }

        .hack-entry-text-slice {
          z-index: 12;
          background: #020202;
          opacity: 0;
          clip-path: inset(
            var(--slice-top)
            0
            calc(100% - var(--slice-bottom))
            0
          );
          transform: translateX(0) skewX(0deg);
          filter: contrast(1.35);
          text-shadow:
            -5px 0 rgba(70, 95, 255, 0.86),
            5px 0 rgba(216, 255, 95, 0.78),
            0 0 12px rgba(255, 255, 255, 0.22);
          animation: hack-entry-text-tear 2.4s infinite steps(1);
          animation-delay: var(--slice-delay);
        }

        .hack-entry-color-block {
          position: absolute;
          top: var(--block-top);
          left: var(--block-left);
          width: var(--block-width);
          height: var(--block-height);
          z-index: 14;
          pointer-events: none;
          background: var(--block-color);
          opacity: 0;
          filter: blur(6px) saturate(1.8);
          mix-blend-mode: screen;
          transform: translateX(0) scaleX(1);
          animation: hack-entry-block-tear 2.3s infinite steps(1);
          animation-delay: var(--block-delay);
        }

        .hack-entry-panel:hover .hack-entry-core,
        .hack-entry-panel:focus-visible .hack-entry-core {
          animation-duration: 1.2s;
        }

        .hack-entry-panel:hover .hack-entry-text-slice,
        .hack-entry-panel:focus-visible .hack-entry-text-slice {
          animation-duration: 0.72s;
        }

        .hack-entry-panel:hover .hack-entry-color-block,
        .hack-entry-panel:focus-visible .hack-entry-color-block {
          animation-duration: 0.82s;
        }

        .hack-entry-panel:focus-visible {
          outline: 2px solid rgba(255, 63, 50, 0.85);
          outline-offset: -4px;
        }

        @keyframes hack-entry-power {
          0%, 100% {
            filter: brightness(1) contrast(1);
            transform: translateX(0) skewX(0deg);
          }

          12% {
            filter: brightness(1.35) contrast(1.5);
            transform: translateX(-2px) skewX(-1deg);
          }

          13% {
            filter: brightness(0.72) contrast(2);
            transform: translateX(2px) skewX(1.2deg);
          }

          14% {
            filter: brightness(1) contrast(1);
            transform: translateX(0) skewX(0deg);
          }

          61% {
            filter: brightness(1.24) contrast(1.35);
          }

          62% {
            filter: brightness(0.78) contrast(1.9);
          }

          63% {
            filter: brightness(1) contrast(1);
          }
        }

        @keyframes hack-entry-channel-a {
          0%, 74%, 100% {
            opacity: 0;
            transform: translateX(-7px);
          }

          75%, 77% {
            opacity: 0.72;
            transform: translateX(-15px);
          }

          78% {
            opacity: 0;
            transform: translateX(-7px);
          }
        }

        @keyframes hack-entry-channel-b {
          0%, 82%, 100% {
            opacity: 0;
            transform: translateX(7px);
          }

          83%, 85% {
            opacity: 0.62;
            transform: translateX(16px);
          }

          86% {
            opacity: 0;
            transform: translateX(7px);
          }
        }

        @keyframes hack-entry-text-tear {
          0%, 80%, 100% {
            opacity: 0;
            transform: translateX(0) skewX(0deg) scaleX(1);
          }

          81% {
            opacity: 0.95;
            transform: translateX(var(--slice-x)) skewX(-8deg) scaleX(1.08);
          }

          82% {
            opacity: 0.45;
            transform: translateX(calc(var(--slice-x) * -0.55)) skewX(6deg) scaleX(0.96);
          }

          83% {
            opacity: 0.82;
            transform: translateX(var(--slice-x)) skewX(-4deg) scaleX(1.14);
          }

          84% {
            opacity: 0;
            transform: translateX(0) skewX(0deg) scaleX(1);
          }
        }

        @keyframes hack-entry-block-tear {
          0%, 84%, 100% {
            opacity: 0;
            transform: translateX(0) scaleX(1);
          }

          85% {
            opacity: 0.75;
            transform: translateX(var(--block-x)) scaleX(1.45);
          }

          86% {
            opacity: 0.32;
            transform: translateX(calc(var(--block-x) * -0.5)) scaleX(0.85);
          }

          87% {
            opacity: 0.64;
            transform: translateX(var(--block-x)) scaleX(1.7);
          }

          88% {
            opacity: 0;
            transform: translateX(0) scaleX(1);
          }
        }
      `}</style>
    </section>
  )
}
