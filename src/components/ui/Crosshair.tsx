"use client"

import {
  useEffect,
  useId,
  useRef,
  type RefObject,
} from "react"
import { gsap } from "gsap"

const lerp = (a: number, b: number, n: number): number =>
  (1 - n) * a + n * b

const getMousePos = (
  event: MouseEvent,
  container?: HTMLElement | null,
): { x: number; y: number } => {
  if (container) {
    const bounds = container.getBoundingClientRect()

    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    }
  }

  return {
    x: event.clientX,
    y: event.clientY,
  }
}

interface CrosshairProps {
  color?: string
  containerRef?: RefObject<HTMLElement | null>
}

export default function Crosshair({
  color = "white",
  containerRef,
}: CrosshairProps) {
  const lineHorizontalRef = useRef<HTMLDivElement>(null)
  const lineVerticalRef = useRef<HTMLDivElement>(null)

  const filterXRef = useRef<SVGFETurbulenceElement>(null)
  const filterYRef = useRef<SVGFETurbulenceElement>(null)

  /*
   * 避免页面存在多个 Crosshair 时 SVG filter ID 冲突。
   * React useId 可能包含冒号，这里将其移除，方便 CSS url(#id) 使用。
   */
  const reactId = useId().replace(/:/g, "")
  const filterXId = `filter-noise-x-${reactId}`
  const filterYId = `filter-noise-y-${reactId}`

  useEffect(() => {
    const container = containerRef?.current ?? null

    const mouse = {
      x: 0,
      y: 0,
    }

    const renderedStyles = {
      tx: {
        previous: 0,
        current: 0,
        amt: 0.15,
      },
      ty: {
        previous: 0,
        current: 0,
        amt: 0.15,
      },
    }

    let animationFrameId = 0
    let renderStarted = false
    let hasMousePosition = false
    let crosshairVisible = false

    const getLines = (): HTMLDivElement[] => {
      return [
        lineHorizontalRef.current,
        lineVerticalRef.current,
      ].filter((element): element is HTMLDivElement => element !== null)
    }

    const setCrosshairVisible = (
      visible: boolean,
      initial = false,
    ) => {
      if (crosshairVisible === visible && !initial) {
        return
      }

      crosshairVisible = visible

      const lines = getLines()

      if (!lines.length) {
        return
      }

      gsap.to(lines, {
        opacity: visible ? 1 : 0,
        ...(initial && visible
          ? {
              duration: 0.9,
              ease: "power3.out",
            }
          : {}),
        overwrite: "auto",
      })
    }

    gsap.set(getLines(), {
      opacity: 0,
    })

    /*
     * 保留原来的 noise 动画：
     * turbulence 从 1 衰减到 0，持续 0.5 秒。
     */
    const primitiveValues = {
      turbulence: 0,
    }

    const noiseTimeline = gsap
      .timeline({
        paused: true,

        onStart: () => {
          if (lineHorizontalRef.current) {
            lineHorizontalRef.current.style.filter =
              `url(#${filterXId})`
          }

          if (lineVerticalRef.current) {
            lineVerticalRef.current.style.filter =
              `url(#${filterYId})`
          }
        },

        onUpdate: () => {
          const turbulence =
            primitiveValues.turbulence.toString()

          filterXRef.current?.setAttribute(
            "baseFrequency",
            turbulence,
          )

          filterYRef.current?.setAttribute(
            "baseFrequency",
            turbulence,
          )
        },

        onComplete: () => {
          if (lineHorizontalRef.current) {
            lineHorizontalRef.current.style.filter = "none"
          }

          if (lineVerticalRef.current) {
            lineVerticalRef.current.style.filter = "none"
          }
        },
      })
      .to(primitiveValues, {
        duration: 0.5,
        ease: "power1",
        startAt: {
          turbulence: 1,
        },
        turbulence: 0,
      })

    const startNoise = () => {
      /*
       * restart() 可以从头播放。
       * 不再在 mouseleave 时 kill timeline。
       */
      noiseTimeline.restart()
    }

    const stopNoise = () => {
      /*
       * 直接跳到结束状态并暂停，但不销毁 timeline。
       * 下一次 mouseenter 仍然可以 restart()。
       */
      noiseTimeline.progress(1).pause()

      if (lineHorizontalRef.current) {
        lineHorizontalRef.current.style.filter = "none"
      }

      if (lineVerticalRef.current) {
        lineVerticalRef.current.style.filter = "none"
      }
    }

    const render = () => {
      renderedStyles.tx.current = mouse.x
      renderedStyles.ty.current = mouse.y

      renderedStyles.tx.previous = lerp(
        renderedStyles.tx.previous,
        renderedStyles.tx.current,
        renderedStyles.tx.amt,
      )

      renderedStyles.ty.previous = lerp(
        renderedStyles.ty.previous,
        renderedStyles.ty.current,
        renderedStyles.ty.amt,
      )

      if (lineVerticalRef.current) {
        gsap.set(lineVerticalRef.current, {
          x: renderedStyles.tx.previous,
        })
      }

      if (lineHorizontalRef.current) {
        gsap.set(lineHorizontalRef.current, {
          y: renderedStyles.ty.previous,
        })
      }

      animationFrameId = requestAnimationFrame(render)
    }

    const startRender = () => {
      if (renderStarted) {
        return
      }

      renderStarted = true
      animationFrameId = requestAnimationFrame(render)
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (container) {
        const bounds = container.getBoundingClientRect()

        const isInside =
          event.clientX >= bounds.left &&
          event.clientX <= bounds.right &&
          event.clientY >= bounds.top &&
          event.clientY <= bounds.bottom

        if (!isInside) {
          setCrosshairVisible(false)
          return
        }
      }

      const position = getMousePos(event, container)

      mouse.x = position.x
      mouse.y = position.y

      if (!hasMousePosition) {
        hasMousePosition = true

        renderedStyles.tx.previous = position.x
        renderedStyles.tx.current = position.x
        renderedStyles.ty.previous = position.y
        renderedStyles.ty.current = position.y

        setCrosshairVisible(true, true)
        startRender()

        return
      }

      setCrosshairVisible(true)
    }

    /*
     * 使用事件委托，而不是只给初始的 a 元素绑定监听器。
     *
     * 当 activeIndex 变化、React 重新创建链接时，
     * 新链接依然可以正常触发 noise。
     */
    const interactionRoot: HTMLElement | Document =
      container ?? document

    const getAnchorFromEvent = (
      event: MouseEvent,
    ): HTMLAnchorElement | null => {
      if (!(event.target instanceof Element)) {
        return null
      }

      const anchor = event.target.closest("a")

      if (!(anchor instanceof HTMLAnchorElement)) {
        return null
      }

      if (!interactionRoot.contains(anchor)) {
        return null
      }

      return anchor
    }

    const handleLinkMouseOver = (event: Event) => {
      const mouseEvent = event as MouseEvent
      const anchor = getAnchorFromEvent(mouseEvent)

      if (!anchor) {
        return
      }

      /*
       * 从链接内部的 h2 移动到 span 时，
       * mouseover 也会冒泡。此时不要重复触发。
       */
      if (
        mouseEvent.relatedTarget instanceof Node &&
        anchor.contains(mouseEvent.relatedTarget)
      ) {
        return
      }

      startNoise()
    }

    const handleLinkMouseOut = (event: Event) => {
      const mouseEvent = event as MouseEvent
      const anchor = getAnchorFromEvent(mouseEvent)

      if (!anchor) {
        return
      }

      /*
       * relatedTarget 仍然位于当前链接内部，
       * 说明只是在链接子元素之间移动。
       */
      if (
        mouseEvent.relatedTarget instanceof Node &&
        anchor.contains(mouseEvent.relatedTarget)
      ) {
        return
      }

      stopNoise()
    }

    /*
     * 使用 window 监听鼠标位置。
     * 即使鼠标从容器边缘快速移出，也能正确隐藏准星。
     */
    window.addEventListener("mousemove", handleMouseMove)

    interactionRoot.addEventListener(
      "mouseover",
      handleLinkMouseOver,
    )

    interactionRoot.addEventListener(
      "mouseout",
      handleLinkMouseOut,
    )

    return () => {
      window.removeEventListener(
        "mousemove",
        handleMouseMove,
      )

      interactionRoot.removeEventListener(
        "mouseover",
        handleLinkMouseOver,
      )

      interactionRoot.removeEventListener(
        "mouseout",
        handleLinkMouseOut,
      )

      cancelAnimationFrame(animationFrameId)

      noiseTimeline.kill()

      const lines = getLines()

      gsap.killTweensOf(lines)

      lines.forEach(line => {
        line.style.filter = "none"
      })
    }
  }, [containerRef, filterXId, filterYId])

  return (
    <div
      className={`${
        containerRef ? "absolute" : "fixed"
      } pointer-events-none top-0 left-0 z-[10000] h-full w-full`}
      aria-hidden="true"
    >
      <svg className="absolute top-0 left-0 h-full w-full">
        <defs>
          <filter id={filterXId}>
            <feTurbulence
              ref={filterXRef}
              type="fractalNoise"
              baseFrequency="0.000001"
              numOctaves="1"
            />

            <feDisplacementMap
              in="SourceGraphic"
              scale="40"
            />
          </filter>

          <filter id={filterYId}>
            <feTurbulence
              ref={filterYRef}
              type="fractalNoise"
              baseFrequency="0.000001"
              numOctaves="1"
            />

            <feDisplacementMap
              in="SourceGraphic"
              scale="40"
            />
          </filter>
        </defs>
      </svg>

      <div
        ref={lineHorizontalRef}
        className="pointer-events-none absolute h-px w-full translate-y-1/2 opacity-0"
        style={{
          background: color,
        }}
      />

      <div
        ref={lineVerticalRef}
        className="pointer-events-none absolute h-full w-px translate-x-1/2 opacity-0"
        style={{
          background: color,
        }}
      />
    </div>
  )
}