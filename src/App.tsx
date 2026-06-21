import { AppPreloader } from "@/components/app-preloader"
import { FullScreenScroll } from "@/components/full-screen-scroll"
import { HackModePage } from "@/components/hack/hack-mode-page"
import { SectionFive } from "@/components/tomato/section-five"
import { SectionFour } from "@/components/tomato/section-four"
import { SectionOne } from "@/components/tomato/section-one"
import { SectionThree } from "@/components/tomato/section-three"
import { SectionTwo } from "@/components/tomato/section-two"
import { useEffect, useState } from "react"

type AppMode = "hack" | "tomato"

const getAppMode = (): AppMode => {
  if (typeof window === "undefined") {
    return "tomato"
  }

  return window.localStorage.getItem("mode") === "hack" ? "hack" : "tomato"
}

export function App() {
  const [mode, setMode] = useState<AppMode>(getAppMode)

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "mode") {
        setMode(getAppMode())
      }
    }

    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  if (mode === "hack") {
    return <HackModePage />
  }

  return (
    <AppPreloader>
      <FullScreenScroll>
        <SectionOne />
        <SectionTwo />
        <SectionThree />
        <SectionFour />
        <SectionFive />
      </FullScreenScroll>
    </AppPreloader>
  )
}

export default App
