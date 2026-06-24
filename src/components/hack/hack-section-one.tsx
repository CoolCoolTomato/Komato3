export function HackSectionOne() {
  return (
    <section className="relative min-h-svh overflow-hidden text-[#ff3f32]">
      <div className="pointer-events-none absolute inset-0 border-b border-[#ff3f32]/35" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 border-b border-[#ff3f32]/20" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 border-t border-[#ff3f32]/20" />

      <div className="pointer-events-none absolute left-0 top-0 h-full w-8 border-r border-[#ff3f32]/20 md:w-16" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 border-l border-[#ff3f32]/20 md:w-16" />

      <div className="pointer-events-none absolute left-8 top-24 h-[calc(100%-12rem)] border-l border-[#ff3f32]/10 md:left-16" />
      <div className="pointer-events-none absolute right-8 top-24 h-[calc(100%-12rem)] border-l border-[#ff3f32]/10 md:right-16" />

      <div className="relative z-10 flex min-h-svh flex-col justify-between px-8 py-8 md:px-16">
        <header className="flex items-center justify-between">
          <h1 className="text-xs font-black uppercase tracking-[0.36em] text-[#ff3f32] ml-10">
            CoolCoolTomato
          </h1>
        </header>

        <div />

        <footer className="flex items-end justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ff3f32]/45 md:text-xs ml-10">
            Build · Break · Create
          </p>

          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ff3f32]/55 bottom-16 relative">
              Q29vbENvb2xUb21hdG8
            </span>
          </div>
        </footer>
      </div>
    </section>
  )
}