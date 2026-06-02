import { FullScreenScroll } from "@/components/full-screen-scroll"
import { SectionFive } from "@/components/sections/section-five"
import { SectionFour } from "@/components/sections/section-four"
import { SectionOne } from "@/components/sections/section-one"
import { SectionThree } from "@/components/sections/section-three"
import { SectionTwo } from "@/components/sections/section-two"

export function App() {
  return (
    <FullScreenScroll>
      <SectionOne />
      <SectionTwo />
      <SectionThree />
      <SectionFour />
      <SectionFive />
    </FullScreenScroll>
  )
}

export default App
