import CircularGallery from '@/components/ui/CircularGallery'

export function HackSectionThree() {
  return (
    <section className="h-svh w-full" aria-label="Hack section three">
      <div className='w-full h-150 bottom-0 absolute'>
        <CircularGallery
          bend={1}
          textColor="#ffffff"
          borderRadius={0.05}
          scrollEase={0.05}
          // Optionally load a custom font for the labels.
          // Accepts a stylesheet URL (e.g. Google Fonts) or a direct font file.
          fontUrl=""
          font="bold 30px Orbitron"
          scrollSpeed={2}
      />
      </div>
    </section>
  )
}
