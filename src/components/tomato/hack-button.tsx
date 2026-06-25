import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react"

type GlitchButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

type GlitchStyle = CSSProperties & Record<`--${string}`, string | number>

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

const textSlices = [
  { top: 8, bottom: 18, x: "-9px", delay: "-0.2s" },
  { top: 24, bottom: 31, x: "7px", delay: "-1.1s" },
  { top: 42, bottom: 52, x: "-13px", delay: "-0.7s" },
  { top: 61, bottom: 68, x: "10px", delay: "-1.6s" },
  { top: 77, bottom: 86, x: "-6px", delay: "-0.4s" },
]

const colorBlocks = [
  {
    top: "5%",
    left: "9%",
    width: "28%",
    height: "18%",
    x: "-12px",
    delay: "-0.1s",
    color: "rgba(216, 255, 95, 0.28)",
  },
  {
    top: "18%",
    left: "62%",
    width: "30%",
    height: "12%",
    x: "14px",
    delay: "-0.8s",
    color: "rgba(70, 95, 255, 0.28)",
  },
  {
    top: "51%",
    left: "4%",
    width: "34%",
    height: "11%",
    x: "-18px",
    delay: "-1.4s",
    color: "rgba(255, 255, 255, 0.2)",
  },
  {
    top: "68%",
    left: "58%",
    width: "38%",
    height: "16%",
    x: "15px",
    delay: "-0.5s",
    color: "rgba(216, 255, 95, 0.22)",
  },
]

export function GlitchButton({
  children,
  className,
  disabled,
  ...props
}: GlitchButtonProps) {
  const glitchText = typeof children === "string" ? children : ""

  return (
    <button
      {...props}
      disabled={disabled}
      data-text={glitchText}
      className={cn(
        "hack-glitch-button group relative isolate h-14 min-w-28 overflow-visible px-6",
        "text-sm font-semibold uppercase tracking-[0.24em] text-white",
        "transition-transform duration-200 active:scale-[0.98]",
        "disabled:pointer-events-none disabled:opacity-40 cursor-pointer",
        className
      )}
    >
      <span aria-hidden="true" className="hack-glitch-frame" />
      <span aria-hidden="true" className="hack-glitch-core" />

      {colorBlocks.map((block, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="hack-glitch-color-block"
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

      <span className="hack-glitch-clip" aria-hidden="true">
        <span className="hack-glitch-color-leak" />
        <span className="hack-glitch-label">{children}</span>

        {glitchText &&
          textSlices.map((slice, index) => (
            <span
              key={index}
              className="hack-glitch-text-slice"
              style={
                {
                  "--slice-top": `${slice.top}%`,
                  "--slice-bottom": `${slice.bottom}%`,
                  "--slice-x": slice.x,
                  "--slice-delay": slice.delay,
                } as GlitchStyle
              }
            >
              {glitchText}
            </span>
          ))}
      </span>

      <span className="sr-only">{children}</span>

      <style>
        {`
          .hack-glitch-button {
            --hack-shape: polygon(
              12% 0%,
              100% 0%,
              94% 34%,
              100% 68%,
              86% 100%,
              0% 100%,
              6% 62%,
              0% 24%
            );
          }

          .hack-glitch-frame {
            position: absolute;
            inset: 0;
            z-index: 0;
            clip-path: var(--hack-shape);
            background:
              linear-gradient(
                135deg,
                rgba(255,255,255,0.42),
                rgba(255,255,255,0.08) 32%,
                rgba(255,255,255,0.16) 64%,
                rgba(255,255,255,0.36)
              );
          }

          .hack-glitch-core {
            position: absolute;
            inset: 1px;
            z-index: 1;
            clip-path: var(--hack-shape);
            background:
              radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 28%),
              radial-gradient(circle at 78% 72%, rgba(255,255,255,0.05), transparent 32%),
              #020202;
            box-shadow:
              inset 0 0 24px rgba(255,255,255,0.055),
              inset 0 0 2px rgba(255,255,255,0.25),
              0 16px 40px rgba(0,0,0,0.48);
            animation: hack-glitch-power 3.8s infinite steps(1);
          }

          .hack-glitch-clip {
            position: absolute;
            inset: 1px;
            z-index: 5;
            display: flex;
            align-items: center;
            justify-content: center;
            clip-path: var(--hack-shape);
            overflow: hidden;
          }

          .hack-glitch-label {
            position: relative;
            z-index: 8;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255,255,255,0.92);
            text-shadow:
              0 0 18px rgba(255,255,255,0.18),
              2px 0 rgba(216,255,95,0.18),
              -2px 0 rgba(65,90,255,0.18);
          }

          .hack-glitch-color-leak {
            position: absolute;
            inset: -18%;
            z-index: 3;
            pointer-events: none;
            opacity: 0;
            background:
              linear-gradient(
                92deg,
                transparent 0%,
                rgba(216,255,95,0.28) 18%,
                transparent 34%,
                rgba(62,85,255,0.32) 58%,
                transparent 76%
              ),
              radial-gradient(circle at 82% 18%, rgba(255,255,255,0.26), transparent 20%);
            filter: blur(7px) contrast(1.4);
            mix-blend-mode: screen;
            transform: translateX(0) skewX(0deg);
            animation: hack-glitch-color-leak 2.9s infinite steps(1);
          }

          .hack-glitch-text-slice {
            position: absolute;
            inset: 0;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            padding-inline: 2rem;
            color: rgba(255,255,255,0.95);
            background: #020202;
            clip-path: inset(
              var(--slice-top)
              0
              calc(100% - var(--slice-bottom))
              0
            );
            opacity: 0;
            transform: translateX(0) skewX(0deg);
            text-shadow:
              -4px 0 rgba(66, 85, 255, 0.85),
              4px 0 rgba(218, 255, 84, 0.78),
              0 0 12px rgba(255,255,255,0.25);
            filter: contrast(1.3);
            animation: hack-glitch-text-tear 2.6s infinite steps(1);
            animation-delay: var(--slice-delay);
          }

          .hack-glitch-color-block {
            position: absolute;
            top: var(--block-top);
            left: var(--block-left);
            width: var(--block-width);
            height: var(--block-height);
            z-index: 12;
            pointer-events: none;
            background: var(--block-color);
            opacity: 0;
            filter: blur(5px) saturate(1.8);
            mix-blend-mode: screen;
            transform: translateX(0) scaleX(1);
            animation: hack-glitch-block-tear 2.4s infinite steps(1);
            animation-delay: var(--block-delay);
          }

          .hack-glitch-button:hover .hack-glitch-core {
            animation-duration: 1.45s;
          }

          .hack-glitch-button:hover .hack-glitch-text-slice {
            animation-duration: 0.9s;
          }

          .hack-glitch-button:hover .hack-glitch-color-leak {
            animation-duration: 1.05s;
          }

          .hack-glitch-button:hover .hack-glitch-color-block {
            animation-duration: 0.95s;
          }

          .hack-glitch-button:focus-visible {
            outline: none;
          }

          .hack-glitch-button:focus-visible .hack-glitch-frame {
            background:
              linear-gradient(
                135deg,
                rgba(255,255,255,0.75),
                rgba(255,255,255,0.18),
                rgba(255,255,255,0.55)
              );
          }

          @keyframes hack-glitch-power {
            0%, 100% {
              filter: brightness(1) contrast(1);
              transform: translate(0, 0) skewX(0deg);
            }

            7% {
              filter: brightness(1.22) contrast(1.25);
            }

            8% {
              filter: brightness(0.72) contrast(1.7);
              transform: translate(-1px, 0) skewX(-1deg);
            }

            9% {
              filter: brightness(1.08) contrast(1.1);
              transform: translate(0, 0) skewX(0deg);
            }

            44% {
              filter: brightness(1.16) contrast(1.35);
              transform: translate(1px, 0);
            }

            45% {
              filter: brightness(0.82) contrast(1.8);
              transform: translate(-2px, 0) skewX(1.2deg);
            }

            46% {
              filter: brightness(1) contrast(1);
              transform: translate(0, 0);
            }

            78% {
              filter: brightness(1.28) contrast(1.5);
            }

            79% {
              filter: brightness(0.68) contrast(2);
            }

            80% {
              filter: brightness(1) contrast(1);
            }
          }

          @keyframes hack-glitch-text-tear {
            0%, 82%, 100% {
              opacity: 0;
              transform: translateX(0) skewX(0deg) scaleX(1);
            }

            83% {
              opacity: 0.95;
              transform: translateX(var(--slice-x)) skewX(-8deg) scaleX(1.06);
            }

            84% {
              opacity: 0.55;
              transform: translateX(calc(var(--slice-x) * -0.6)) skewX(6deg) scaleX(0.96);
            }

            85% {
              opacity: 0.9;
              transform: translateX(var(--slice-x)) skewX(-4deg) scaleX(1.12);
            }

            86% {
              opacity: 0;
              transform: translateX(0) skewX(0deg) scaleX(1);
            }
          }

          @keyframes hack-glitch-color-leak {
            0%, 76%, 100% {
              opacity: 0;
              transform: translateX(0) skewX(0deg) scaleX(1);
            }

            77% {
              opacity: 0.75;
              transform: translateX(-16px) skewX(-10deg) scaleX(1.12);
            }

            78% {
              opacity: 0.28;
              transform: translateX(18px) skewX(8deg) scaleX(0.92);
            }

            79% {
              opacity: 0.62;
              transform: translateX(-7px) skewX(-4deg) scaleX(1.2);
            }

            80% {
              opacity: 0;
              transform: translateX(0) skewX(0deg) scaleX(1);
            }
          }

          @keyframes hack-glitch-block-tear {
            0%, 84%, 100% {
              opacity: 0;
              transform: translateX(0) scaleX(1);
            }

            85% {
              opacity: 0.75;
              transform: translateX(var(--block-x)) scaleX(1.35);
            }

            86% {
              opacity: 0.35;
              transform: translateX(calc(var(--block-x) * -0.5)) scaleX(0.85);
            }

            87% {
              opacity: 0.68;
              transform: translateX(var(--block-x)) scaleX(1.6);
            }

            88% {
              opacity: 0;
              transform: translateX(0) scaleX(1);
            }
          }
        `}
      </style>
    </button>
  )
}