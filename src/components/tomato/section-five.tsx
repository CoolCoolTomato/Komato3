import { ArrowUpRight } from "lucide-react"
import { useRef } from "react"

import {
  ProductRevealCanvas,
  ProductRevealFrame,
  productInitialRestScrollVh,
  productSwitchScrollVh,
  type ProductRevealImage,
} from "@/components/tomato/product-reveal-frame"
import Crosshair from "@/components/ui/Crosshair"

type ProductItem = {
  images: ProductRevealImage[]
  label: string
  title: string
  description: string
  href: string
}

const products: ProductItem[] = [
  {
    images: [
      {
        src: "/LearnLang.png",
        alt: "LearnLang AI language learning platform interface",
      },
    ],
    label: "AI Learning",
    title: "LearnLang",
    href: "https://github.com/CoolCoolTomato/LearnLang",
    description:
      "An AI-powered language learning platform that turns conversations, vocabulary, and personalized feedback into a focused learning experience.",
  },
  {
    images: [
      {
        src: "/MatoEditor.png",
        alt: "MatoEditor minimalist Markdown editor interface",
      },
    ],
    label: "Writing Tool",
    title: "MatoEditor",
    href: "https://github.com/CoolCoolTomato/MatoEditor",
    description:
      "A clean and distraction-free Markdown editor designed for fast writing, real-time preview, and effortless content organization.",
  },
  {
    images: [
      {
        src: "/WhiteBlog.png",
        alt: "WhiteBlog minimalist personal blog interface",
      },
    ],
    label: "Digital Publishing",
    title: "WhiteBlog",
    href: "https://github.com/CoolCoolTomato/WhiteBlog",
    description:
      "A minimalist publishing platform built around thoughtful typography, structured content, and a refined reading experience.",
  },
]

type ProductRowProps = {
  product: ProductItem
  index: number
  total: number
}

function ProductRow({ product, index, total }: ProductRowProps) {
  const infoPanelRef = useRef<HTMLDivElement>(null)
  const isReversed = index % 2 === 1
  const transitionCount = Math.max(product.images.length - 1, 0)
  const sectionHeightVh =
    transitionCount === 0
      ? 100
      : 100 +
        productInitialRestScrollVh +
        transitionCount * productSwitchScrollVh

  return (
    <article
      data-product-reveal-section
      className="relative bg-white"
      style={{ height: `${sectionHeightVh}svh` }}
    >
      <div
        className={[
          "sticky top-0 z-20 grid h-svh grid-rows-[40%_60%] overflow-hidden border-t border-[#ff3f32]/55 md:grid-rows-none",
          isReversed ? "md:grid-cols-[30%_70%]" : "md:grid-cols-[70%_30%]",
        ].join(" ")}
      >
        <div
          className={[
            "order-2 min-h-0 min-w-0 border-t border-[#ff3f32]/55 md:border-t-0",
            isReversed ? "md:order-2 md:border-l" : "md:order-1 md:border-r",
          ].join(" ")}
        >
          <ProductRevealFrame images={product.images} />
        </div>

        <div
          ref={infoPanelRef}
          className={[
            "relative flex min-h-0 min-w-0 flex-col justify-between overflow-hidden bg-white px-6 py-7 md:px-10 md:py-10",
            isReversed ? "order-1 md:order-1" : "order-1 md:order-2",
          ].join(" ")}
        >
          <Crosshair containerRef={infoPanelRef} color="#ff3f32" />

          <div className="relative z-10 flex items-start justify-between">
            <div className="h-2 w-16 bg-[#ff3f32] md:h-3 md:w-24" />

            <p className="text-xs font-black tracking-[0.16em]">
              {String(index + 1).padStart(2, "0")}
              {" / "}
              {String(total).padStart(2, "0")}
            </p>
          </div>

          <div className="relative z-10">
            <p className="mb-4 text-xs font-black tracking-[0.2em] uppercase md:text-sm">
              {product.label}
            </p>

            <a
              href={product.href}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex max-w-full flex-col text-inherit no-underline focus-visible:outline-none"
              aria-label={`Explore ${product.title}`}
            >
              <h2 className="max-w-[7ch] text-[clamp(2rem,5vw,5rem)] leading-[0.9] font-black tracking-[-0.055em]">
                {product.title}
              </h2>

              <span className="mt-3 flex translate-y-1 items-center gap-2 text-xs font-black tracking-[0.18em] uppercase opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                Explore
                <ArrowUpRight className="size-3" strokeWidth={2.5} />
              </span>
            </a>
          </div>

          <p className="relative z-10 max-w-[18ch] text-[clamp(1rem,2vw,2rem)] leading-[1.12] font-medium tracking-[-0.045em]">
            {product.description}
          </p>
        </div>
      </div>
    </article>
  )
}

export function SectionFive() {
  return (
    <section
      className="relative border-b border-[#ff3f32]/55 bg-white pb-px text-[#ff3f32]"
      aria-label="Products"
    >
      <ProductRevealCanvas className="relative">
        {products.map((product, index) => (
          <ProductRow
            key={product.title}
            product={product}
            index={index}
            total={products.length}
          />
        ))}
      </ProductRevealCanvas>
    </section>
  )
}
