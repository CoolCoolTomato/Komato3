import type { HackTransitionPhase } from "./shared"

export function HackAnchorThree({
  lineProgress,
}: {
  lineProgress: number
  phase: HackTransitionPhase
}) {
  return (
    <>
      <div
        className="absolute right-50 top-0 h-full -translate-x-1/2 border-l border-[#ff3f32]/40"
        style={{
          opacity: lineProgress,
          transform: `translateX(-50%) scaleY(${lineProgress})`,
          transformOrigin: "center top",
          boxShadow: "0 0 18px rgba(255, 63, 50, 0.38)",
        }}
      />
      <div
        className="absolute right-55 top-0 h-full -translate-x-1/2 border-l border-[#ff3f32]/40"
        style={{
          opacity: lineProgress,
          transform: `translateX(-50%) scaleY(${lineProgress})`,
          transformOrigin: "center top",
          boxShadow: "0 0 18px rgba(255, 63, 50, 0.38)",
        }}
      />
      <div
        className="absolute right-80 top-0 h-full -translate-x-1/2 border-l border-[#ff3f32]/40"
        style={{
          opacity: lineProgress,
          transform: `translateX(-50%) scaleY(${lineProgress})`,
          transformOrigin: "center top",
          boxShadow: "0 0 18px rgba(255, 63, 50, 0.38)",
        }}
      />
      <div
        className="absolute top-200 w-full border-t border-[#ff3f32]/40"
        style={{
          opacity: lineProgress,
          transform: `scaleX(${lineProgress})`,
          transformOrigin: "center top",
          boxShadow: "0 0 18px rgba(255, 63, 50, 0.38)",
        }}
      />
      <div
        className="absolute top-30 w-full border-t border-[#ff3f32]/40"
        style={{
          opacity: lineProgress,
          transform: `scaleX(${lineProgress})`,
          transformOrigin: "center top",
          boxShadow: "0 0 18px rgba(255, 63, 50, 0.38)",
        }}
      />
    </>
  )
}
