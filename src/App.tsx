import { AppPreloader } from "@/components/app-preloader"
import { FullScreenScroll } from "@/components/full-screen-scroll"
import { SectionFive } from "@/components/sections/section-five"
import { SectionFour } from "@/components/sections/section-four"
import { SectionOne } from "@/components/sections/section-one"
import { SectionThree } from "@/components/sections/section-three"
import { SectionTwo } from "@/components/sections/section-two"

export function App() {
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
