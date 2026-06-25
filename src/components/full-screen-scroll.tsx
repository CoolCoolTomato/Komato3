import { Children, isValidElement, type ReactNode, useEffect, useRef } from "react"

const boundarySnapDelay = 200

// 需要吸附的 section 边界
// [fromIndex, toIndex]
const snapBoundaries = [
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
] as const

// SectionThree -> SectionFour 视差区间
const parallaxFromIndex = 2
const parallaxToIndex = 3

const wheelScrollDamping = 0.2
const snapScrollDamping = 0.08

// SectionFour 初始露出的比例
// 0.5 = 起始时露出半屏
const sectionFourInitialRevealRatio = 0.5

type FullScreenScrollProps = {
  children: ReactNode
}

function isCompactSection(section: ReactNode) {
  return (
    isValidElement<{ compactScrollSection?: boolean }>(section) &&
    section.props.compactScrollSection === true
  )
}

export function FullScreenScroll({ children }: FullScreenScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const snapTimeoutRef = useRef<number | undefined>(undefined)
  const scrollAnimationFrameRef = useRef<number | undefined>(undefined)

  const currentScrollTopRef = useRef(0)
  const targetScrollTopRef = useRef(0)
  const scrollDampingRef = useRef(wheelScrollDamping)
  const isDampedScrollingRef = useRef(false)
  const isSnapLockedByHoverRef = useRef(false)

  const sectionRefs = useRef<Array<HTMLElement | null>>([])

  const sections = Children.toArray(children)

  useEffect(() => {
    const container = containerRef.current

    if (!container || sections.length <= parallaxToIndex) {
      return
    }

    const clearSnapTimeout = () => {
      if (snapTimeoutRef.current) {
        window.clearTimeout(snapTimeoutRef.current)
        snapTimeoutRef.current = undefined
      }
    }

    const getMaxScrollTop = () =>
      Math.max(container.scrollHeight - container.clientHeight, 0)

    const resetParallax = () => {
      const sectionFour = sectionRefs.current[parallaxToIndex]

      if (sectionFour) {
        sectionFour.style.transform = ""
      }
    }

    const updateParallax = () => {
      const sectionThree = sectionRefs.current[parallaxFromIndex]
      const sectionFour = sectionRefs.current[parallaxToIndex]

      if (!sectionThree || !sectionFour) {
        return
      }

      const viewportHeight = container.clientHeight
      const scrollTop = container.scrollTop

      const start = sectionThree.offsetTop
      const end = sectionFour.offsetTop

      const rawProgress = (scrollTop - start) / Math.max(end - start, 1)
      const progress = Math.min(Math.max(rawProgress, 0), 1)

      const isInTransition = scrollTop >= start && scrollTop <= end

      if (!isInTransition) {
        resetParallax()
        return
      }

      /*
        正常滚动时：
        - progress = 0，Section4 原本在屏幕下方，完全不可见
        - progress = 1，Section4 正好完全进入屏幕

        现在要的效果：
        - progress = 0，Section4 已经露出一半
        - progress = 1，Section4 正好完全进入屏幕

        所以只移动 Section4：
        - 初始向上移动 50vh
        - 随着 progress 增加，逐渐回到 0
      */
      const initialOffset =
        viewportHeight * sectionFourInitialRevealRatio

      const translateY = -(1 - progress) * initialOffset

      sectionFour.style.transform = `translate3d(0, ${translateY}px, 0)`
    }

    const startDampedScroll = () => {
      if (scrollAnimationFrameRef.current) {
        return
      }

      isDampedScrollingRef.current = true

      const animateScroll = () => {
        const nextScrollTop =
          currentScrollTopRef.current +
          (targetScrollTopRef.current - currentScrollTopRef.current) *
            scrollDampingRef.current

        currentScrollTopRef.current =
          Math.abs(targetScrollTopRef.current - nextScrollTop) < 0.5
            ? targetScrollTopRef.current
            : nextScrollTop

        container.scrollTop = currentScrollTopRef.current
        updateParallax()

        if (
          Math.abs(targetScrollTopRef.current - currentScrollTopRef.current) <
          0.5
        ) {
          container.scrollTop = targetScrollTopRef.current
          currentScrollTopRef.current = targetScrollTopRef.current
          updateParallax()

          scrollAnimationFrameRef.current = undefined
          isDampedScrollingRef.current = false
          return
        }

        scrollAnimationFrameRef.current =
          window.requestAnimationFrame(animateScroll)
      }

      scrollAnimationFrameRef.current =
        window.requestAnimationFrame(animateScroll)
    }

    const snapSectionBoundary = () => {
      if (isSnapLockedByHoverRef.current) {
        return
      }

      const viewportTop = container.scrollTop
      const viewportHeight = container.clientHeight

      for (const [fromIndex, toIndex] of snapBoundaries) {
        const fromSection = sectionRefs.current[fromIndex]
        const toSection = sectionRefs.current[toIndex]

        if (!fromSection || !toSection) {
          continue
        }

        const fromSectionBottom = fromSection.offsetTop + fromSection.offsetHeight

        const transitionStart = fromSectionBottom - viewportHeight
        const transitionEnd = fromSectionBottom

        const isInBoundary =
          viewportTop > transitionStart && viewportTop < transitionEnd

        if (!isInBoundary) {
          continue
        }

        const fromVisibleHeight = fromSectionBottom - viewportTop
        const toVisibleHeight = viewportHeight - fromVisibleHeight

        const targetTop =
          fromVisibleHeight >= toVisibleHeight
            ? transitionStart
            : toSection.offsetTop

        if (Math.abs(container.scrollTop - targetTop) < 2) {
          return
        }

        targetScrollTopRef.current = Math.min(
          Math.max(targetTop, 0),
          getMaxScrollTop(),
        )

        scrollDampingRef.current = snapScrollDamping
        startDampedScroll()

        return
      }
    }

    const handleScroll = () => {
      updateParallax()

      if (!isDampedScrollingRef.current) {
        currentScrollTopRef.current = container.scrollTop
        targetScrollTopRef.current = container.scrollTop
      }

      clearSnapTimeout()

      if (isSnapLockedByHoverRef.current) {
        return
      }

      snapTimeoutRef.current = window.setTimeout(
        snapSectionBoundary,
        boundarySnapDelay,
      )
    }

    const handlePointerOver = (event: PointerEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("[data-scroll-snap-lock='true']")
      ) {
        isSnapLockedByHoverRef.current = true
        clearSnapTimeout()
      }
    }

    const handlePointerOut = (event: PointerEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("[data-scroll-snap-lock='true']") &&
        !(event.relatedTarget instanceof HTMLElement &&
          event.relatedTarget.closest("[data-scroll-snap-lock='true']"))
      ) {
        isSnapLockedByHoverRef.current = false
        clearSnapTimeout()
        snapTimeoutRef.current = window.setTimeout(
          snapSectionBoundary,
          boundarySnapDelay,
        )
      }
    }

    const handlePointerLeave = () => {
      isSnapLockedByHoverRef.current = false
    }

    const handleWheel = (event: WheelEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("[data-scroll-lock='true']")
      ) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        clearSnapTimeout()

        if (scrollAnimationFrameRef.current) {
          window.cancelAnimationFrame(scrollAnimationFrameRef.current)
          scrollAnimationFrameRef.current = undefined
        }

        currentScrollTopRef.current = container.scrollTop
        targetScrollTopRef.current = container.scrollTop
        isDampedScrollingRef.current = false
        return
      }

      event.preventDefault()
      clearSnapTimeout()

      const delta =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? event.deltaY * container.clientHeight
            : event.deltaY

      currentScrollTopRef.current = container.scrollTop
      scrollDampingRef.current = wheelScrollDamping

      targetScrollTopRef.current = Math.min(
        Math.max(targetScrollTopRef.current + delta, 0),
        getMaxScrollTop(),
      )

      startDampedScroll()
    }

    currentScrollTopRef.current = container.scrollTop
    targetScrollTopRef.current = container.scrollTop

    updateParallax()

    container.addEventListener("scroll", handleScroll, { passive: true })
    container.addEventListener("wheel", handleWheel, { passive: false })
    container.addEventListener("pointerover", handlePointerOver, {
      passive: true,
    })
    container.addEventListener("pointerout", handlePointerOut, {
      passive: true,
    })
    container.addEventListener("pointerleave", handlePointerLeave)

    window.addEventListener("resize", updateParallax)

    return () => {
      clearSnapTimeout()

      if (scrollAnimationFrameRef.current) {
        window.cancelAnimationFrame(scrollAnimationFrameRef.current)
      }

      resetParallax()

      container.removeEventListener("scroll", handleScroll)
      container.removeEventListener("wheel", handleWheel)
      container.removeEventListener("pointerover", handlePointerOver)
      container.removeEventListener("pointerout", handlePointerOut)
      container.removeEventListener("pointerleave", handlePointerLeave)
      window.removeEventListener("resize", updateParallax)
    }
  }, [sections.length])

  return (
    <main className="relative h-svh overflow-hidden bg-background">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto"
        aria-label="Full screen sections"
      >
        {sections.map((section, index) => (
          <section
            key={index}
            ref={(el) => {
              sectionRefs.current[index] = el
            }}
            className={[
              isCompactSection(section)
                ? "w-full shrink-0"
                : "min-h-svh w-full shrink-0 [&>*]:min-h-svh",
              index === parallaxFromIndex
                ? "relative z-20"
                : "",
              index === parallaxToIndex
                ? "relative z-10 bg-background will-change-transform"
                : "",
            ].join(" ")}
          >
            {section}
          </section>
        ))}
      </div>
    </main>
  )
}
