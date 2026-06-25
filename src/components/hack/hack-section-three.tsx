import CircularGallery from '@/components/ui/CircularGallery'
import GlitchText from '@/components/ui/GlitchText';
import { hackGalleryItems } from "@/components/hack/hack-assets"
import { useEffect, useState } from "react"

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)")

    const update = () => {
      setIsDesktop(mediaQuery.matches)
    }

    update()
    mediaQuery.addEventListener("change", update)

    return () => {
      mediaQuery.removeEventListener("change", update)
    }
  }, [])

  return isDesktop
}

export function HackSectionThree() {
  const isDesktop = useIsDesktop()

  const bend = isDesktop ? 2 : 1
  return (
    <section className="h-svh w-full" aria-label="Hack section three">
      <div className='w-full relative pl-[50px] md:top-[-20px] top-[20px]'>
        <GlitchText
          speed={2}
          enableShadows
          enableOnHover={false}
          className='md:top-[50px] relative'
        >
          SKILLS
        </GlitchText>
        <GlitchText
          speed={2}
          enableShadows
          enableOnHover={false}
          className='relative'
        >
          OROROR
        </GlitchText>
        <GlitchText
          speed={2}
          enableShadows
          enableOnHover={false}
          className='md:top-[-50px] relative'
        >
          TOOLS
        </GlitchText>
      </div>

      <div className='w-full h-[50%] bottom-0 absolute'>
        <CircularGallery
          items={hackGalleryItems}
          bend={bend}
          textColor="#ff3f32"
          borderRadius={0.05}
          scrollEase={0.05}
          // Optionally load a custom font for the labels.
          // Accepts a stylesheet URL (e.g. Google Fonts) or a direct font file.
          fontUrl=""
          font="bold 30px Orbitron"
          scrollSpeed={1.5}
        />
      </div>
    </section>
  )
}
