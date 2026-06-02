import { useRef } from "react"

import { SectionTitleBand } from "@/components/sections/section-title-band"
import { StickyInfoList } from "@/components/sections/sticky-info-list"
import { TomatoRevealFrame } from "@/components/sections/tomato-reveal-frame"

export function SectionTwo() {
  const scrollRootRef = useRef<HTMLElement>(null)

  return (
    <section
      ref={scrollRootRef}
      className="relative h-[500svh] bg-white text-[#ff3f32]"
    >
      <div className="sticky top-0 h-svh overflow-hidden bg-white">
        <SectionTitleBand
          title="About Me"
          className="h-[5%] md:h-[10%]"
          scrollRootRef={scrollRootRef}
        />
        <div className="relative h-[95%] border-b border-[#ff3f32]/55 md:h-[90%]">
          <div className="relative z-10 grid h-full grid-rows-[48svh_1fr] md:grid-cols-[55%_1fr] md:grid-rows-none">
            <div className="min-h-0 border-b border-[#ff3f32]/55 md:border-b-0 md:border-r">
              <TomatoRevealFrame scrollRootRef={scrollRootRef} />
            </div>
            <div />
          </div>
        </div>
      </div>
      <StickyInfoList scrollRootRef={scrollRootRef} />
    </section>
  )
}
