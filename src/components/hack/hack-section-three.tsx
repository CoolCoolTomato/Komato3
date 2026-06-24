import CircularGallery from '@/components/ui/CircularGallery'
import GlitchText from '@/components/ui/GlitchText';

export function HackSectionThree() {
  return (
    <section className="h-svh w-full" aria-label="Hack section three">
      <div className='w-full relative pl-[50px] top-[-20px]'>
        <GlitchText
          speed={2}
          enableShadows
          enableOnHover={false}
          className='top-[50px] relative'
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
          className='top-[-50px] relative'
        >
          TOOLS
        </GlitchText>
      </div>

      <div className='w-full h-[50%] bottom-0 absolute'>
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
    </section>
  )
}
