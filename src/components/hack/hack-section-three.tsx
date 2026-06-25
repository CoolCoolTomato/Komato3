import CircularGallery from '@/components/ui/CircularGallery'
import GlitchText from '@/components/ui/GlitchText';

export function HackSectionThree() {
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

      <div className='hidden md:block w-full h-[50%] bottom-0 absolute'>
        <CircularGallery
          bend={2}
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
      <div className='md:hidden w-full h-[50%] bottom-0 absolute'>
        <CircularGallery
          bend={1}
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
