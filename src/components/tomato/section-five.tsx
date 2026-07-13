import { useState } from "react"

import {
  ProductRevealFrame,
  productInitialRestScrollVh,
  productSwitchScrollVh,
  type ProductRevealImage,
} from "@/components/tomato/product-reveal-frame"

type ProductItem =
  ProductRevealImage & {
    label: string
    title: string
    description: string
  }

const products: ProductItem[] = [
  {
    src: "/LearnLang.png",
    alt: "LearnLang AI language learning platform interface",
    label: "AI Learning",
    title: "LearnLang",
    description:
      "An AI-powered language learning platform that turns conversations, vocabulary, and personalized feedback into a focused learning experience.",
  },
  {
    src: "/MatoEditor.png",
    alt: "MatoEditor minimalist Markdown editor interface",
    label: "Writing Tool",
    title: "MatoEditor",
    description:
      "A clean and distraction-free Markdown editor designed for fast writing, real-time preview, and effortless content organization.",
  },
  {
    src: "/WhiteBlog.png",
    alt: "WhiteBlog minimalist personal blog interface",
    label: "Digital Publishing",
    title: "WhiteBlog",
    description:
      "A minimalist publishing platform built around thoughtful typography, structured content, and a refined reading experience.",
  },
]

export function SectionFive() {
  const [activeIndex, setActiveIndex] =
    useState(0)

  const activeProduct =
    products[activeIndex] ??
    products[0]

  const transitionCount = Math.max(
    products.length - 1,
    0,
  )

  /**
   * 100svh：sticky 本身占据的视口高度。
   * 20svh：首图完全展开后的静止缓冲。
   * 每次切换 120svh：100svh dither + 20svh 静止。
   */
  const sectionHeightVh =
    100 +
    productInitialRestScrollVh +
    transitionCount *
      productSwitchScrollVh

  return (
    <section
      data-product-reveal-section
      className="relative bg-white text-[#ff3f32]"
      style={{
        height: `${sectionHeightVh}svh`,
      }}
    >
      <div className="sticky top-0 grid h-svh grid-cols-[70%_30%] overflow-hidden border-y border-[#ff3f32]/55 bg-white">
        <div className="min-h-0 min-w-0 border-r border-[#ff3f32]/55">
          <ProductRevealFrame
            images={products}
            onActiveIndexChange={
              setActiveIndex
            }
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-col justify-between px-6 py-7 md:px-10 md:py-10">
          <div className="flex items-start justify-between">
            <div className="h-2 w-16 bg-[#ff3f32] md:h-3 md:w-24" />

            <p className="text-xs font-black tracking-[0.16em]">
              {String(
                activeIndex + 1,
              ).padStart(2, "0")}
              {" / "}
              {String(
                products.length,
              ).padStart(2, "0")}
            </p>
          </div>

          <div
            key={`title-${activeIndex}`}
            className="animate-[product-text-enter_500ms_cubic-bezier(0.22,1,0.36,1)]"
          >
            <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] md:text-sm">
              {activeProduct.label}
            </p>

            <h2 className="max-w-[7ch] text-[clamp(2.5rem,7vw,7.5rem)] font-black leading-[0.9] tracking-[-0.055em]">
              {activeProduct.title}
            </h2>
          </div>

          <p
            key={`description-${activeIndex}`}
            className="max-w-[18ch] animate-[product-text-enter_500ms_cubic-bezier(0.22,1,0.36,1)] text-[clamp(1rem,2vw,2rem)] font-medium leading-[1.12] tracking-[-0.045em]"
          >
            {activeProduct.description}
          </p>
        </div>
      </div>

      <style>
        {`
          @keyframes product-text-enter {
            from {
              opacity: 0;
              transform: translate3d(0, 18px, 0);
              filter: blur(8px);
            }

            to {
              opacity: 1;
              transform: translate3d(0, 0, 0);
              filter: blur(0);
            }
          }
        `}
      </style>
    </section>
  )
}
