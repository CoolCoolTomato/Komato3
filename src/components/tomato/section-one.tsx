import { TomatoScanModel } from "@/components/tomato/tomato-scan-model"

export function SectionOne() {
  return (
    <div className="relative h-svh overflow-hidden bg-white border-b border-[#ff3f32]/55">
      <div className="absolute inset-0 grid grid-rows-[50%_50%] md:grid-cols-[33%_1fr] md:grid-rows-none">
        <div />
        <div className="grid grid-rows-[1fr_50px] md:grid-rows-[96px_76px_76px_1fr_76px]">
          <div className="border-b hidden md:block border-[#ff3f32]/55" />
          <div className="hidden md:grid grid-cols-[40%_1fr_10%] md:grid-cols-[40%_1fr_5%] border-b md:border-[#ff3f32]/20">
            <div className="border-r flex items-center border-[#ff3f32]/20">
              <p className="text-[#ff3f32] text-lg font-black uppercase tracking-[0.2em] ml-10">
                2 0 2 6
              </p>
            </div>
            <div className="border-r flex items-center border-[#ff3f32]/20">
              <p className="text-[#ff3f32] text-lg font-black uppercase tracking-[0.2em] ml-10">
                ©CoolCoolTomato
              </p>
            </div>
            <div />
          </div>
          <div className="hidden md:grid grid-cols-[40%_1fr_10%] md:grid-cols-[40%_1fr_5%] border-b md:border-[#ff3f32]/20">
            <div className="border-r border-[#ff3f32]/20" />
            <div className="border-r border-[#ff3f32]/20" />
            <div />
          </div>
          <div className="grid grid-cols-[1fr_10%] md:grid-cols-[40%_1fr_5%] border-b border-[#ff3f32]/55 md:border-[#ff3f32]/20">
            <div className="border-r hidden md:block border-[#ff3f32]/20 relative">
              <div className="pointer-events-none absolute inset-x-8 bottom-8 top-8 z-10 bg-[linear-gradient(to_top,rgba(255,63,50,0.28)_1px,transparent_1px)] bg-[length:100%_18px] opacity-60" />
            </div>
            <div className="border-r border-[#ff3f32]/55 md:border-[#ff3f32]/20">
              <TomatoScanModel />
            </div>
            <div />
          </div>
          <div className="grid grid-cols-[40%_1fr_10%] md:grid-cols-[40%_1fr_5%]">
            <div className="border-r border-[#ff3f32]/55 md:border-[#ff3f32]/20" />
            <div className="border-r border-[#ff3f32]/55 md:border-[#ff3f32]/20" />
            <div />
          </div>
        </div>
      </div>

      <main className="relative z-10 grid h-full grid-rows-[50%_50%] md:grid-cols-[33%_1fr] md:grid-rows-none">
        <div className="border-b border-[#ff3f32]/55 md:border-b-0 md:border-r flex min-h-0 flex-col justify-between px-6 pb-6 pt-7 md:px-7 md:pb-11 md:pt-8">
          <div className="h-3 w-24 bg-[#ff3f32]" />

          <div className="text-[#ff3f32]">
            <p className="mb-5 text-sm font-black uppercase tracking-[0.22em] md:mb-6">
              Cool Cool
            </p>
            <h1 className="max-w-[8ch] text-[clamp(3.9rem,19vw,6rem)] font-black leading-[0.9] tracking-[-0.055em] md:max-w-[7ch] md:text-[clamp(4.4rem,7vw,8.7rem)]">
              Tomato
            </h1>
          </div>

          <p className="text-[#ff3f32] max-w-[18ch] text-[clamp(1.45rem,7vw,2.15rem)] font-medium leading-[1.12] tracking-[-0.05em] md:max-w-[12ch] md:text-[clamp(2rem,2.15vw,2.65rem)]">
            Time matters less in quantity than in purpose.
          </p>
        </div>
        <div />
      </main>
    </div>
  )
}
