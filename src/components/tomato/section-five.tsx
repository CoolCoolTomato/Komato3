import { ProductRevealFrame } from "@/components/tomato/product-reveal-frame"

export function SectionFive() {
  return (
    <section className="relative h-svh overflow-hidden bg-white border-t border-b border-[#ff3f32]/55 text-[#ff3f32]">
      <div className="grid h-full grid-cols-[70%_30%]">
        <div className="min-w-0 border-r border-[#ff3f32]/55">
          <ProductRevealFrame src="/2024.png" alt="Product preview" />
        </div>

        <div className="flex min-w-0 flex-col justify-between px-6 py-7 md:px-10 md:py-10">
          <div className="h-2 w-16 bg-[#ff3f32] md:h-3 md:w-24" />

          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] md:text-sm">
              Product
            </p>
            <h2 className="max-w-[7ch] text-[clamp(2.5rem,7vw,7.5rem)] font-black leading-[0.9] tracking-[-0.055em]">
              Product Lab
            </h2>
          </div>

          <p className="max-w-[18ch] text-[clamp(1rem,2vw,2rem)] font-medium leading-[1.12] tracking-[-0.045em]">
            Tools, experiments, and small systems built to make ideas tangible.
          </p>
        </div>
      </div>
    </section>
  )
}