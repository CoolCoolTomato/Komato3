export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

export const getScrollContainer = (element: HTMLElement) => {
  let parent = element.parentElement

  while (parent) {
    const overflowY = window.getComputedStyle(parent).overflowY

    if (overflowY === "auto" || overflowY === "scroll") {
      return parent
    }

    parent = parent.parentElement
  }

  return null
}
