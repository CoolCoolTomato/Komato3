export type HackTransitionPhase = "idle" | "exiting" | "entering"

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

export function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 999.923) * 10000
  return x - Math.floor(x)
}