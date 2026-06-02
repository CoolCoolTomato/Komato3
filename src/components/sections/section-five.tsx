import { useRef, useState } from "react"
import { ArrowUpRight, X } from "lucide-react"

import {
  BilibiliIcon,
  GithubIcon,
  MailIcon,
  OverwatchIcon,
  TelegramIcon,
  TwitterIcon,
} from "@/components/icons"
import { SectionTitleBand } from "@/components/sections/section-title-band"

const contactItems = [
  {
    name: "Twitter",
    value: "@coolcooltomato",
    label: "Social Media",
    href: "https://x.com/coolcooltomato",
    Icon: TwitterIcon,
  },
  {
    name: "TeleGram",
    value: "@coolcooltomato",
    label: "Instant Messaging",
    href: "https://t.me/coolcooltomato",
    Icon: TelegramIcon,
  },
  {
    name: "Bilibili",
    value: "CoolCoolTomato",
    label: "Videos Sharing",
    href: "#",
    Icon: BilibiliIcon,
  },
  {
    name: "GitHub",
    value: "@coolcooltomato",
    label: "Code repository",
    href: "https://github.com/coolcooltomato",
    Icon: GithubIcon,
  },
  {
    name: "Email",
    value: "coolcooltomato@gmail.com",
    label: "Email Contact",
    href: "mailto:coolcooltomato@gmail.com",
    Icon: MailIcon,
  },
  {
    name: "Overwatch",
    value: "CoolCoolTomato",
    label: "Overwatch account",
    href: "#",
    Icon: OverwatchIcon,
  },
]

export function SectionFive() {
  const scrollRootRef = useRef<HTMLElement>(null)
  const [selectedContact, setSelectedContact] = useState<
    (typeof contactItems)[number] | null
  >(null)

  const openSelectedContact = () => {
    if (!selectedContact) {
      return
    }

    if (selectedContact.href.startsWith("http")) {
      window.open(selectedContact.href, "_blank", "noopener,noreferrer")
    } else if (selectedContact.href !== "#") {
      window.location.href = selectedContact.href
    }

    setSelectedContact(null)
  }

  return (
    <section
      ref={scrollRootRef}
      className="relative h-svh overflow-hidden bg-white text-[#ff3f32]"
    >
      <div className="relative z-10 h-svh bg-transparent">
        <SectionTitleBand
          title="Contact Me"
          className="h-[5svh] md:h-[10svh]"
          scrollRootRef={scrollRootRef}
        />

        <main className="grid h-[95svh] grid-rows-[32%_1fr] md:h-[90svh] md:grid-cols-[33%_1fr] md:grid-rows-none">
          {/* Left intro */}
          <aside className="flex min-h-0 flex-col justify-between border-b border-[#ff3f32]/55 px-6 py-5 md:border-b-0 md:border-r md:px-7 md:pb-11 md:pt-8">
            <div className="h-3 w-24 bg-[#ff3f32]" />

            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] md:mb-6 md:text-sm">
                Let&apos;s Build
              </p>
              <h2 className="max-w-[8ch] text-[clamp(3.1rem,15vw,5.2rem)] font-black leading-[0.88] tracking-[-0.06em] md:text-[clamp(4.5rem,7vw,8.5rem)]">
                With Tomato
              </h2>
            </div>

            <p className="max-w-[22ch] text-[clamp(1.05rem,4.8vw,1.55rem)] font-medium leading-[1.12] tracking-[-0.05em] md:max-w-[13ch] md:text-[clamp(1.9rem,2.15vw,2.65rem)]">
              Open to projects, ideas, bugs, games, and strange experiments.
            </p>
          </aside>

          {/* Contact cards */}
          <div className="relative min-h-0 overflow-hidden">
            <div className="grid h-full grid-cols-1 grid-rows-6 md:grid-cols-2 md:grid-rows-3">
              {contactItems.map((item, index) => (
                <article
                  key={item.name}
                  className={`group relative flex min-h-0 flex-col justify-between overflow-hidden border-b border-[#ff3f32]/55 px-5 py-3 outline-none transition-colors duration-300 before:absolute before:inset-y-0 before:left-0 before:w-full before:origin-left before:scale-x-0 before:bg-[#ff3f32] before:transition-transform before:duration-300 before:ease-out hover:text-white hover:before:scale-x-100 md:px-8 md:py-6 ${
                    index % 2 === 0
                      ? "md:border-r md:border-[#ff3f32]/55"
                      : ""
                  } ${
                    index >= contactItems.length - 2
                      ? "md:border-b-0"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    className="absolute inset-0 z-20 cursor-pointer opacity-0 md:hidden"
                    aria-label={`Open ${item.name}`}
                    onClick={() => setSelectedContact(item)}
                  />

                  <item.Icon className="pointer-events-none absolute bottom-3 right-5 z-0 size-16 opacity-10 transition-opacity duration-300 group-hover:opacity-20 md:bottom-5 md:right-8 md:size-24" />

                  <div className="relative z-10 flex flex-col items-start gap-3 md:gap-4">
                    <div>
                      <h3 className="text-[clamp(1.5rem,7vw,2.8rem)] font-black uppercase leading-[0.85] tracking-[-0.07em] md:text-[clamp(2.5rem,4vw,5.3rem)]">
                        {item.name}
                      </h3>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <button
                      type="button"
                      className="mb-4 hidden h-8 w-24 shrink-0 cursor-pointer bg-white text-[#ff3f32] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current md:flex md:h-12 md:w-36"
                      aria-label={`Open ${item.name}`}
                      onClick={() => setSelectedContact(item)}
                    >
                      <div className="flex w-16 items-center justify-center border border-r-0 border-current text-[1rem] font-bold uppercase leading-[1.25] tracking-[0.08em] md:w-24">
                        Open
                      </div>
                      <div className="flex size-8 items-center justify-center border border-current md:size-12">
                        <ArrowUpRight className="size-4 md:size-6" />
                      </div>
                    </button>
                    <p className="mb-1 max-w-[24ch] text-[clamp(0.95rem,4.6vw,1.45rem)] font-medium leading-[1.05] tracking-[-0.05em] md:mb-2 md:text-[clamp(1.25rem,2vw,2.4rem)]">
                      {item.value}
                    </p>
                    <p className="max-w-[34ch] text-[0.65rem] font-bold uppercase leading-[1.25] tracking-[0.08em] opacity-75 md:text-sm">
                      {item.label}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </main>
      </div>

      {selectedContact ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-dialog-title"
        >
          <div className="w-full max-w-sm border border-[#ff3f32]/55 bg-white text-[#ff3f32] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#ff3f32]/55 px-5 py-4">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.18em]">
                  Open Contact
                </p>
                <h3
                  id="contact-dialog-title"
                  className="text-3xl font-black uppercase leading-none tracking-[-0.06em]"
                >
                  {selectedContact.name}
                </h3>
              </div>
              <button
                type="button"
                className="cursor-pointer flex size-8 shrink-0 items-center justify-center border border-current hover:bg-[#ff3f32] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                aria-label="Close dialog"
                onClick={() => setSelectedContact(null)}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-5 py-5">
              <p className="text-xl font-medium leading-tight tracking-[-0.04em]">
                Open {selectedContact.value}?
              </p>
              <p className="mt-3 text-sm font-bold uppercase leading-snug tracking-[0.08em] opacity-70">
                {selectedContact.href === "#"
                  ? "This contact does not have an external link yet."
                  : selectedContact.href}
              </p>
            </div>

            <div className="grid grid-cols-2 border-t border-[#ff3f32]/55">
              <button
                type="button"
                className="cursor-pointer h-12 border-r border-[#ff3f32]/55 text-sm font-black uppercase tracking-[0.12em] hover:bg-[#ff3f32] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current"
                onClick={() => setSelectedContact(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cursor-pointer flex h-12 items-center justify-center gap-2 text-sm font-black uppercase tracking-[0.12em] hover:bg-[#ff3f32] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current disabled:cursor-not-allowed disabled:opacity-40"
                disabled={selectedContact.href === "#"}
                onClick={openSelectedContact}
              >
                Open
                <ArrowUpRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
