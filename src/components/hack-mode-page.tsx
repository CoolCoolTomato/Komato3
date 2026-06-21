export function HackModePage() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-[#07120b] text-[#b8ff62]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(184,255,98,0.18),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(0,255,166,0.12),transparent_32%),linear-gradient(180deg,rgba(7,18,11,0)_0%,rgba(7,18,11,0.88)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(184,255,98,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(184,255,98,0.45)_1px,transparent_1px)] [background-size:32px_32px]" />

      <section className="relative z-10 grid min-h-svh grid-rows-[auto_1fr_auto] border border-[#b8ff62]/30">
        <header className="flex items-center justify-between border-b border-[#b8ff62]/30 px-5 py-4 font-mono text-xs uppercase tracking-[0.28em] sm:px-8">
          <span>mode:hack</span>
          <span className="hidden sm:inline">localstorage override active</span>
          <span>Komato3</span>
        </header>

        <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_34%]">
          <div className="flex min-h-[70svh] flex-col justify-between border-b border-[#b8ff62]/30 px-6 py-8 sm:px-10 sm:py-12 lg:border-b-0 lg:border-r">
            <div>
              <p className="mb-6 font-mono text-sm font-bold uppercase tracking-[0.35em] text-[#57ffb1]">
                alternate entry
              </p>
              <h1 className="max-w-[9ch] text-[clamp(4.5rem,18vw,12rem)] font-black uppercase leading-[0.78] tracking-[-0.09em]">
                Hack
                <br />
                Mode
              </h1>
            </div>

            <p className="max-w-[28ch] text-[clamp(1.4rem,5vw,3rem)] font-medium leading-[1.02] tracking-[-0.06em] text-[#e7ffd0]">
              A separate launch surface controlled by the browser mode flag.
            </p>
          </div>

          <aside className="grid min-h-[30svh] grid-rows-3 font-mono text-sm uppercase tracking-[0.16em]">
            <div className="flex items-end border-b border-[#b8ff62]/30 p-6">
              <span className="text-[#57ffb1]">01 / detect storage</span>
            </div>
            <div className="flex items-end border-b border-[#b8ff62]/30 p-6">
              <span>02 / render isolated page</span>
            </div>
            <div className="flex items-end p-6">
              <span>03 / switch back with mode=tomato</span>
            </div>
          </aside>
        </div>

        <footer className="overflow-hidden border-t border-[#b8ff62]/30 py-3 font-mono text-sm uppercase tracking-[0.28em]">
          <div className="animate-[splash-marquee_16s_linear_infinite] whitespace-nowrap">
            <span className="mx-6">set localStorage.mode to tomato for the original site</span>
            <span className="mx-6">set localStorage.mode to hack for this screen</span>
            <span className="mx-6">set localStorage.mode to tomato for the original site</span>
            <span className="mx-6">set localStorage.mode to hack for this screen</span>
          </div>
        </footer>
      </section>
    </main>
  )
}
