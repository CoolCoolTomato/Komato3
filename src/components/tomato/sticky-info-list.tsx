import { type CSSProperties, useEffect, useRef, useState } from "react"

import {
  McDonaldIcon,
  OverwatchIcon,
  ProgrammerIcon,
  SecurityIcon,
} from "@/components/icons"
import { clamp, getScrollContainer } from "@/lib/scroll"
import { GlitchButton } from "./hack-button"

const stickyListItems = [
  {
    title: " McDonald's King",
    subtitle: "Loyal to fries, burgers, and midnight cravings.",
    Icon: McDonaldIcon,
  },
  {
    title: "OW Officer",
    subtitle: "Grinding ranked games while questioning teammates.",
    Icon: OverwatchIcon,
  },
  {
    title: " Programmer",
    subtitle: "Turning coffee and bugs into working products.",
    Icon: ProgrammerIcon,
  },
  {
    title: "Cyber Security",
    subtitle: "Breaking, fixing, and securing the digital world.",
    Icon: SecurityIcon,
  },
]
const stickyTitleOffset = 90
const mobileStickyTitleOffset = 65

type StickyInfoListProps = {
  scrollRootRef: React.RefObject<HTMLElement | null>
}

function switchToHackMode() {
  window.localStorage.setItem("mode", "hack")
  window.location.reload()
}

export function StickyInfoList({ scrollRootRef }: StickyInfoListProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [exitOffset, setExitOffset] = useState(0)
  const [scrollInSection, setScrollInSection] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  useEffect(() => {
    const root = rootRef.current

    if (!root) {
      return
    }

    const container = getScrollContainer(root)

    if (!container) {
      return
    }

    const updateExitOffset = () => {
      const scrollRoot = scrollRootRef.current

      if (!scrollRoot) {
        return
      }

      const sectionStart = scrollRoot.offsetTop
      const nextScrollInSection = Math.max(container.scrollTop - sectionStart, 0)
      const stickyEnd =
        sectionStart + scrollRoot.offsetHeight - container.clientHeight
      const nextExitOffset = clamp(
        container.scrollTop - stickyEnd,
        0,
        container.clientHeight,
      )

      setScrollInSection(nextScrollInSection)
      setViewportHeight(container.clientHeight)
      setExitOffset(nextExitOffset)
    }

    updateExitOffset()
    container.addEventListener("scroll", updateExitOffset, { passive: true })
    window.addEventListener("resize", updateExitOffset)

    return () => {
      container.removeEventListener("scroll", updateExitOffset)
      window.removeEventListener("resize", updateExitOffset)
    }
  }, [scrollRootRef])

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-20 
        border-b border-[#ff3f32]/55 md:border-b-0
        transform-none md:transform-[translateY(var(--exit-offset))]"
      style={{ "--exit-offset": `${-exitOffset}px` } as CSSProperties}
    >
      <div className="sticky top-0 grid h-svh grid-rows-[53svh_1fr] md:hidden">
        <div />
        <div className="relative min-h-0 overflow-hidden">
          {stickyListItems.map((item, index) => {
            const panelHeight = viewportHeight * 0.4
            const stackDistance =
              (stickyListItems.length - 1) *
              Math.max(panelHeight - mobileStickyTitleOffset, 1)
            const stackScroll = Math.min(scrollInSection, stackDistance)
            const restingTop = index * mobileStickyTitleOffset
            const movingTop = index * panelHeight - stackScroll
            const top = Math.max(restingTop, movingTop)

            return (
              <article
                key={item.title}
                className={`group pointer-events-auto absolute left-0 right-0 flex h-[40svh] flex-col overflow-hidden transition-colors duration-300 before:absolute before:inset-y-0 before:left-0 before:w-full before:origin-left before:scale-x-0 before:bg-[#ff3f32] before:transition-transform before:duration-300 before:ease-out hover:text-white hover:before:scale-x-100 ${
                  index !== 0 ? "border-t border-[#ff3f32]/55 bg-white" : ""
                }`}
                style={{
                  transform: `translateY(${top}px)`,
                  zIndex: index + 1,
                }}
              >
                <div className="relative z-10 grid h-full grid-cols-[80%_1fr]">
                  <div className="h-full border-r border-[#ff3f32]/55 px-5 py-5 transition-colors duration-200 group-hover:border-white/70">
                    <div className="min-h-[50px]">
                      <h3 className="mt-1 max-w-[18ch] text-[clamp(0.9rem,4.3vw,1.25rem)] font-black leading-[0.92] tracking-[-0.05em]">
                        {item.title}
                      </h3>
                    </div>
                    <div className="flex flex-1 items-start">
                      <p className="max-w-[26ch] text-[clamp(1.3rem,6.2vw,3rem)] font-medium leading-[1.12] tracking-[-0.045em]">
                        {item.subtitle}
                      </p>
                    </div>
                    {index === 3 && 
                      <div className="left-[60%] top-5 relative">
                        <GlitchButton onClick={switchToHackMode}>Enter</GlitchButton>
                      </div>
                    }
                  </div>
                  <div className="flex items-start justify-center px-2 py-3">
                    <item.Icon className="size-9 text-current" />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <div className="hidden md:grid md:absolute md:inset-0 md:grid-cols-[55%_1fr] md:grid-rows-[10svh_1fr] md:[--sticky-list-top:10svh]">
        <div className="hidden md:block" />
        <div className="hidden md:block" />
        <div className="hidden md:block" />
        <div className="relative min-h-0">
          {stickyListItems.map((item, index) => (
            <article
              key={item.title}
              className={`group pointer-events-auto sticky flex h-[55svh] flex-col overflow-hidden transition-colors duration-300 before:absolute before:inset-y-0 before:left-0 before:w-full before:origin-left before:scale-x-0 before:bg-[#ff3f32] before:transition-transform before:duration-300 before:ease-out hover:text-white hover:before:scale-x-100 ${
                index !== 0 ? "border-t border-[#ff3f32]/55 bg-white" : ""
              } ${index === 3 ? "border-b border-[#ff3f32]/55" : ""}`}
              style={{
                top: `calc(var(--sticky-list-top) + ${
                  index * stickyTitleOffset
                }px)`,
                zIndex: index + 1,
              }}
            >
              <div className="relative z-10 grid h-full md:grid-cols-[80%_1fr]">
                <div className="h-full border-r border-[#ff3f32]/55 px-10 py-8 transition-colors duration-200 group-hover:border-white/70">
                  <div className="min-h-[60px] pb-6">
                    <h3 className="mt-1 max-w-[18ch] text-[clamp(1.2rem,1.8vw,2rem)] font-black leading-[0.92] tracking-[-0.05em]">
                      {item.title}
                    </h3>
                  </div>
                  <div className="flex flex-1 items-start">
                    <p className="max-w-[24ch] text-[clamp(1.8rem,3.6vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.045em]">
                      {item.subtitle}
                    </p>
                  </div>
                  {index === 3 && 
                    <div className="left-[70%] top-20 relative">
                      <GlitchButton onClick={switchToHackMode}>Enter</GlitchButton>
                    </div>
                  }
                </div>
                <div className="flex items-start justify-center px-4 py-4">
                  <item.Icon className="size-12 text-white xl:size-14" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
