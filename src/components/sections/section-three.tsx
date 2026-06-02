import { BlogMosaicCanvas } from "@/components/sections/blog-mosaic-canvas"
import { SectionTitleBand } from "@/components/sections/section-title-band"
import { ArrowRight, ArrowUpRight, X } from "lucide-react"
import { useState } from "react"
import ScrambledText from '../ui/ScrambledText';

export function SectionThree() {
  const [copied, setCopied] = useState(false)

  const link = "coolcooltomato.github.io"

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)

    window.setTimeout(() => {
      setCopied(false)
    }, 1200)
  }

  const [selectedExplore, setSelectedExplore] = useState(false)

  const exploreHref = "https://coolcooltomato.github.io"

  const openExplorePage = () => {
    window.open(exploreHref, "_blank", "noopener,noreferrer")
    setSelectedExplore(false)
  }

  return (
    <section className="flex min-h-svh flex-col bg-white lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_min(100svh,60vw)_100px]">
      {/* Mobile: top / Desktop: right */}
      <div className="order-1 flex w-full items-center justify-center lg:order-2 lg:block">
        <div className="relative aspect-square w-full max-w-svw lg:h-svh lg:w-full lg:max-w-none lg:aspect-auto">
          {/* Frame lines */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 border border-[#ff3f32]/55 lg:border-t-0" />
            <div className="absolute left-0 right-0 top-[30px] border-t border-[#ff3f32]/55" />
            <div className="absolute bottom-[30px] left-0 right-0 border-t border-[#ff3f32]/55" />
            <div className="absolute bottom-0 left-[30px] top-0 border-l border-[#ff3f32]/55" />
            <div className="absolute bottom-0 right-[30px] top-0 border-l border-[#ff3f32]/55" />
          </div>

          {/* Mosaic */}
          <div className="absolute inset-[30px] overflow-hidden bg-black lg:inset-auto lg:left-[30px] lg:top-[30px] lg:size-[min(calc(100svh-60px),calc(100%-60px))]">
            <BlogMosaicCanvas className="h-full w-full" />
          </div>
        </div>
      </div>

      {/* Mobile: bottom / Desktop: left */}
      <div className="order-2 relative flex min-h-0 flex-col lg:order-1">
        <div className="h-[64px] shrink-0 lg:h-[10%]">
          <SectionTitleBand title="Articles" />
        </div>

        <div className="flex flex-1 flex-col border-b border-[#ff3f32]/55 text-[#ff3f32]">
          <div className="flex-1">
            {/* w-full px-6 pt-8 text-[clamp(1.75rem,7vw,3rem)] font-bold uppercase leading-[1.05] sm:px-10 sm:pt-10 lg:text-3xl */}
            <ScrambledText
              className="w-full px-6 pt-8 text-[clamp(1.75rem,7vw,3rem)] font-bold uppercase leading-[1.05] sm:px-10 sm:pt-10 lg:text-3xl"
              radius={100}
              duration={1.2}
              speed={0.5}
              scrambleChars=".:"
            >
              A curated hub for technical articles, project logs, dev notes, and research.
            </ScrambledText>

            <ScrambledText
              className="w-full px-6 py-8 text-[clamp(1.05rem,4vw,1.25rem)] font-medium leading-snug sm:w-[70%] sm:px-10 sm:py-10 lg:text-xl"
              radius={100}
              duration={1.2}
              speed={0.5}
              scrambleChars=".:"
            >
              Focused on software engineering, cybersecurity, Linux systems, modern web development, and AI applications.
            </ScrambledText>

            <div className="px-6 pb-10 sm:px-10 lg:py-10">
              <button
                type="button"
                onClick={() => setSelectedExplore(true)}
                className="group relative flex h-[50px] w-full max-w-[250px] cursor-pointer items-center overflow-hidden border border-[#ff3f32] pl-1 text-left text-[#ff3f32]"
              >
                {/* Hover background */}
                <div className="absolute inset-y-0 left-0 w-full origin-left scale-x-0 bg-[#ff3f32] transition-transform duration-500 ease-out group-hover:scale-x-100" />

                <p className="relative z-10 flex-1 px-3 text-2xl font-black uppercase transition-colors duration-300 group-hover:text-white">
                  Explore
                </p>

                <div className="relative z-10 flex h-[50px] w-[50px] shrink-0 items-center justify-center border-l border-[#ff3f32] bg-[#ff3f32] transition-colors duration-300">
                  <ArrowRight
                    size={24}
                    strokeWidth={3}
                    className="text-white transition-all duration-300 group-hover:translate-x-1"
                  />
                </div>
              </button>
            </div>
          </div>

          <div className="border-t border-[#ff3f32]/55">
            <button
              type="button"
              onClick={handleCopy}
              className="group perspective-[1000px] relative block w-full cursor-pointer text-left"
              aria-label="Copy website link"
            >
              <div className="relative w-full h-[calc(clamp(1rem,3.8vw,1.5rem)*1.05+3rem)] transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(180deg)] sm:h-[calc(clamp(1rem,3.8vw,1.5rem)*1.05+3rem)]">
                {/* Front */}
                <p className="absolute inset-0 flex items-center px-6 py-6 text-[clamp(1rem,3.8vw,1.5rem)] font-black uppercase leading-[1.05] tracking-[0.08em] text-[#ff3f32] [backface-visibility:hidden] sm:px-10">
                  {copied ? "Copied!" : "coolcooltomato.github.io"}
                </p>

                {/* Back */}
                <p className="absolute inset-0 flex items-center bg-[#ff3f32] px-6 py-6 text-[clamp(1rem,3.8vw,1.5rem)] font-black uppercase leading-[1.05] tracking-[0.08em] text-white [backface-visibility:hidden] [transform:rotateX(180deg)] sm:px-10">
                  {copied ? "Copied!" : "coolcooltomato.github.io"}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="hidden order-3 border-b border-[#ff3f32]/55 lg:block"></div>

      {selectedExplore ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="explore-dialog-title"
        >
          <div className="w-full max-w-sm border border-[#ff3f32]/55 bg-white text-[#ff3f32] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#ff3f32]/55 px-5 py-4">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.18em]">
                  Open Page
                </p>
                <h3
                  id="explore-dialog-title"
                  className="text-3xl font-black uppercase leading-none tracking-[-0.06em]"
                >
                  Articles
                </h3>
              </div>

              <button
                type="button"
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center border border-current hover:bg-[#ff3f32] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                aria-label="Close dialog"
                onClick={() => setSelectedExplore(false)}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-5 py-5">
              <p className="text-xl font-medium leading-tight tracking-[-0.04em]">
                Open coolcooltomato.github.io?
              </p>

              <p className="mt-3 text-sm font-bold uppercase leading-snug tracking-[0.08em] opacity-70">
                {exploreHref}
              </p>
            </div>

            <div className="grid grid-cols-2 border-t border-[#ff3f32]/55">
              <button
                type="button"
                className="h-12 cursor-pointer border-r border-[#ff3f32]/55 text-sm font-black uppercase tracking-[0.12em] hover:bg-[#ff3f32] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current"
                onClick={() => setSelectedExplore(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="flex h-12 cursor-pointer items-center justify-center gap-2 text-sm font-black uppercase tracking-[0.12em] hover:bg-[#ff3f32] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current"
                onClick={openExplorePage}
              >
                Open
                <ArrowUpRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}