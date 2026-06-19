import { Environment, useGLTF } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState, Suspense } from "react"
import { ArrowUpRight, X } from "lucide-react"
import type { Group, Object3D } from "three"
import { Box3, Mesh, Vector3 } from "three"

import {
  BilibiliIcon,
  GithubIcon,
  MailIcon,
  OverwatchIcon,
  TelegramIcon,
  TwitterIcon,
} from "@/components/icons"
import nightEnvironmentUrl from "@/assets/dikhololo_night_1k.hdr?url"
import { SectionTitleBand } from "@/components/sections/section-title-band"

function isMesh(object: Object3D): object is Mesh {
  return "isMesh" in object && object.isMesh === true
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

type TomatoRotation = {
  x: number
  y: number
}

function ContactTomatoModel({
  rotationRef,
  scaleRef,
  isDraggingRef,
}: {
  rotationRef: React.RefObject<TomatoRotation>
  scaleRef: React.RefObject<number>
  isDraggingRef: React.RefObject<boolean>
}) {
  const groupRef = useRef<Group>(null)
  const { scene } = useGLTF("/tomato.glb")

  const tomatoScene = useMemo(() => {
    const clone = scene.clone(true)

    clone.traverse((child) => {
      if (isMesh(child)) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map((material) => material.clone())
        } else {
          child.material = child.material.clone()
        }

        child.castShadow = true
        child.receiveShadow = true
      }
    })

    const box = new Box3().setFromObject(clone)
    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3())
    const maxAxis = Math.max(size.x, size.y, size.z)

    clone.position.sub(center)
    clone.scale.setScalar(maxAxis > 0 ? 2.45 / maxAxis : 1)

    return clone
  }, [scene])

  useFrame((_, delta) => {
    const group = groupRef.current

    if (!group) {
      return
    }

    if (!isDraggingRef.current) {
      rotationRef.current.y += delta * 0.42
    }

    group.rotation.x += (rotationRef.current.x - group.rotation.x) * 0.12
    group.rotation.y += (rotationRef.current.y - group.rotation.y) * 0.12
    group.scale.setScalar(
      group.scale.x + (scaleRef.current - group.scale.x) * 0.12,
    )
  })

  return (
    <group ref={groupRef} position={[0, -0.12, 0]}>
      <primitive object={tomatoScene} />
    </group>
  )
}

function ContactTomatoCanvas() {
  const [isReady, setIsReady] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const revealFrameRef = useRef<number | undefined>(undefined)
  const rotationRef = useRef<TomatoRotation>({ x: 0.12, y: -0.35 })
  const scaleRef = useRef(1)
  const isDraggingRef = useRef(false)
  const dragRef = useRef({
    pointerId: -1,
    x: 0,
    y: 0,
  })

  useEffect(() => {
    const root = rootRef.current

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      scaleRef.current = clamp(scaleRef.current - event.deltaY * 0.001, 0.78, 1.9)
    }

    root?.addEventListener("wheel", handleWheel, {
      capture: true,
      passive: false,
    })

    return () => {
      root?.removeEventListener("wheel", handleWheel, {
        capture: true,
      })

      if (revealFrameRef.current) {
        window.cancelAnimationFrame(revealFrameRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={rootRef}
      data-scroll-lock="true"
      className="relative h-full min-h-0 w-full cursor-grab overflow-hidden overscroll-contain bg-white touch-none active:cursor-grabbing"
      aria-label="Interactive tomato model"
      onPointerDown={(event) => {
        isDraggingRef.current = true
        dragRef.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (!isDraggingRef.current || dragRef.current.pointerId !== event.pointerId) {
          return
        }

        const deltaX = event.clientX - dragRef.current.x
        const deltaY = event.clientY - dragRef.current.y

        rotationRef.current.y += deltaX * 0.008
        rotationRef.current.x = clamp(
          rotationRef.current.x + deltaY * 0.006,
          -0.85,
          0.85,
        )
        dragRef.current.x = event.clientX
        dragRef.current.y = event.clientY
      }}
      onPointerUp={(event) => {
        isDraggingRef.current = false
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
      }}
      onPointerCancel={(event) => {
        isDraggingRef.current = false
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
      }}
    >
      <Canvas
        className={`bg-white transition-opacity duration-300 ${
          isReady ? "opacity-100" : "opacity-0"
        }`}
        camera={{ position: [0, 0.1, 4.4], fov: 34 }}
        dpr={[1, 2]}
        gl={{ alpha: false, antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor("#ffffff", 1)
          gl.domElement.style.backgroundColor = "#ffffff"
          revealFrameRef.current = window.requestAnimationFrame(() => {
            setIsReady(true)
          })
        }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={["#ffffff"]} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[3, 4, 5]} intensity={2.4} />
          <pointLight position={[-3, -2, 3]} color="#ff3f32" intensity={4} />
          <ContactTomatoModel
            rotationRef={rotationRef}
            scaleRef={scaleRef}
            isDraggingRef={isDraggingRef}
          />
          <Environment files={nightEnvironmentUrl} />
        </Suspense>
      </Canvas>
    </div>
  )
}

function ContactAside() {
  const rootRef = useRef<HTMLElement>(null)
  const [grid, setGrid] = useState({
    left: 48,
    right: 320,
    top: 64,
    bottom: 336,
  })

  useEffect(() => {
    const root = rootRef.current

    if (!root) {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) {
        return
      }

      const width = entry.contentRect.width
      const height = entry.contentRect.height
      const isCompact = width < 520 || height < 420
      const minSideEdge = isCompact ? 24 : 36
      const minTopEdge = isCompact ? 20 : 42
      const minBottomEdge = isCompact ? 76 : 132
      const centerSize = Math.max(
        1,
        Math.min(width - minSideEdge * 2, height - minTopEdge - minBottomEdge),
      )
      const left = (width - centerSize) / 2
      const topBottomSpace = Math.max(height - centerSize, 0)
      const bottomSpace = clamp(
        topBottomSpace * 0.58,
        minBottomEdge,
        Math.max(topBottomSpace - minTopEdge, minBottomEdge),
      )
      const top = Math.max(topBottomSpace - bottomSpace, 0)

      setGrid({
        left,
        right: left + centerSize,
        top,
        bottom: top + centerSize,
      })
    })

    observer.observe(root)

    return () => {
      observer.disconnect()
    }
  }, [])

  const centerSize = grid.right - grid.left

  return (
    <aside
      ref={rootRef}
      className="relative min-h-0 overflow-hidden border-b border-[#ff3f32]/55 bg-white md:border-b-0 md:border-r"
    >
      <div
        className="pointer-events-none absolute bottom-0 top-0 z-20 border-l border-[#ff3f32]/25"
        style={{ left: grid.left }}
      />
      <div
        className="pointer-events-none absolute bottom-0 top-0 z-20 border-l border-[#ff3f32]/25"
        style={{ left: grid.right }}
      />
      <div
        className="pointer-events-none absolute left-0 right-0 z-20 border-t border-[#ff3f32]/25"
        style={{ top: grid.top }}
      />
      <div
        className="pointer-events-none absolute left-0 right-0 z-20 border-t border-[#ff3f32]/25"
        style={{ top: grid.bottom }}
      />

      <div className="absolute left-6 top-5 z-10 h-3 w-24 bg-[#ff3f32] md:left-7 md:top-8" />

      <div
        className="absolute z-10"
        style={{
          left: grid.left,
          top: grid.top,
          width: centerSize,
          height: centerSize,
        }}
      >
        <ContactTomatoCanvas />
      </div>

      <div
        className="absolute z-10 flex items-end px-4 pb-5 pt-4 md:px-6 md:pb-8"
        style={{
          left: grid.left,
          right: `calc(100% - ${grid.right}px)`,
          top: grid.bottom,
          bottom: 0,
        }}
      >
        <p className="max-w-[22ch] text-[clamp(1.05rem,4.8vw,1.55rem)] font-medium leading-[1.12] tracking-[-0.05em] md:max-w-[16ch] md:text-[clamp(1.9rem,2.15vw,2.65rem)]">
          Open to projects, ideas, bugs, games, and strange experiments.
        </p>
      </div>
    </aside>
  )
}

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
          <ContactAside />

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

useGLTF.preload("/tomato.glb")
