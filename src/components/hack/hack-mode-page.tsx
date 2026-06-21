import { Environment, useGLTF } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { Group, Object3D } from "three"
import { Box3, Mesh, PerspectiveCamera, Vector3, MeshLambertMaterial, Color } from "three"

import nightEnvironmentUrl from "@/assets/dikhololo_night_1k.hdr?url"

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

function isMesh(object: Object3D): object is Mesh {
  return "isMesh" in object && object.isMesh === true
}

function usePageProgress(rootRef: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0

      const root = rootRef.current

      if (!root) {
        return
      }

      const rootTop = root.getBoundingClientRect().top + window.scrollY
      const scrollableDistance = Math.max(root.offsetHeight - window.innerHeight, 1)
      const nextProgress = clamp(
        (window.scrollY - rootTop) / scrollableDistance,
        0,
        1,
      )

      setProgress(nextProgress)
    }

    const requestUpdate = () => {
      if (frame) {
        return
      }

      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", requestUpdate, { passive: true })
    window.addEventListener("resize", requestUpdate)

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }

      window.removeEventListener("scroll", requestUpdate)
      window.removeEventListener("resize", requestUpdate)
    }
  }, [rootRef])

  return progress
}

function HackerModel({ progress }: { progress: number }) {
  const groupRef = useRef<Group>(null)
  const progressRef = useRef(progress)
  const { scene } = useGLTF("/man.glb")

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  const hackerScene = useMemo(() => {
    const clone = scene.clone(true)

    clone.traverse((child) => {
      if (!isMesh(child)) {
        return
      }

      child.material = new MeshLambertMaterial({
        color: new Color("#252525"),
      })

      child.castShadow = false
      child.receiveShadow = false
    })

    const box = new Box3().setFromObject(clone)
    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3())
    const maxAxis = Math.max(size.x, size.y, size.z)

    clone.position.sub(center)
    clone.scale.setScalar(maxAxis > 0 ? 2.65 / maxAxis : 1)

    return clone
  }, [scene])

  useFrame(({ clock }) => {
    const group = groupRef.current

    if (!group) {
      return
    }

    const p = progressRef.current
    const scanLean = Math.sin(p * Math.PI * 2.2) * 0.08
    const targetRotation =
      -0.18 +
      Math.sin(p * Math.PI * 1.25 - 0.35) * 0.42 -
      p * 0.34

    group.rotation.y += (targetRotation - group.rotation.y) * 0.08
    group.rotation.x +=
      (scanLean + Math.sin(clock.elapsedTime * 0.65) * 0.025 - group.rotation.x) *
      0.08
    group.rotation.z +=
      (Math.sin(p * Math.PI * 1.8) * 0.035 - group.rotation.z) * 0.08
    group.position.y = -0.08 + Math.sin(clock.elapsedTime * 1.1) * 0.015
  })

  return (
    <group ref={groupRef} position={[0, -0.72, 0]}>
      <primitive object={hackerScene} />
    </group>
  )
}

function CameraRig({ progress }: { progress: number }) {
  const progressRef = useRef(progress)
  const easedProgressRef = useRef(progress)
  const cameraTargetRef = useRef(new Vector3())
  const cameraPositionRef = useRef(new Vector3())
  const lookAtRef = useRef(new Vector3())

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useFrame(({ camera }) => {
    easedProgressRef.current +=
      (progressRef.current - easedProgressRef.current) * 0.075

    const p = easedProgressRef.current
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)

    const s = ease(p)

    /**
     * 只增不减：镜头永远朝一个方向绕
     * 如果最后不是正脸，只改 endAngle
     */
    const startAngle = -1.05
    const endAngle = startAngle + Math.PI * 2.4

    const orbitAngle = startAngle + (endAngle - startAngle) * s

    const radius = 5.8 - s * 3.65
    const height = 1.45 - s * 0.42

    cameraTargetRef.current.set(
      Math.sin(orbitAngle) * radius,
      height,
      Math.cos(orbitAngle) * radius,
    )

    cameraPositionRef.current.copy(camera.position)
    cameraPositionRef.current.lerp(cameraTargetRef.current, 0.08)
    camera.position.copy(cameraPositionRef.current)

    /**
     * lookAt 也不要来回摆动，平滑上移到脸
     */
    lookAtRef.current.set(
      0,
      0.68 + s * 0.28,
      0,
    )

    camera.lookAt(lookAtRef.current)

    if (camera instanceof PerspectiveCamera) {
      const targetFov = 36 - s * 13
      camera.fov += (targetFov - camera.fov) * 0.08
      camera.updateProjectionMatrix()
    }
  })

  return null
}

function HackerCanvas({ progress }: { progress: number }) {
  return (
    <Canvas
      camera={{ position: [-3.5, 1.22, 4.1], fov: 34 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
    >
      <Suspense fallback={null}>
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#101010", 6, 12]} />

        <ambientLight intensity={0.85} />

        <directionalLight
          position={[3, 4, 4]}
          intensity={1.8}
        />

        <directionalLight
          position={[-4, 2, -3]}
          color="#7CFF41"
          intensity={0.9}
        />

        <HackerModel progress={progress} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.98, 0]}>
          <circleGeometry args={[3.4, 96]} />
          <meshBasicMaterial color="#070a08" />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.965, 0]}>
          <ringGeometry args={[1.05, 1.08, 128]} />
          <meshBasicMaterial color="#7CFF41" transparent opacity={0.25} />
        </mesh>

        <CameraRig progress={progress} />
      </Suspense>
    </Canvas>
  )
}

export function HackModePage() {
  const rootRef = useRef<HTMLElement>(null)
  const progress = usePageProgress(rootRef)

  return (
    <main
      ref={rootRef}
      className="relative min-h-[500svh] bg-[#050706]"
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="absolute inset-0">
          <HackerCanvas progress={progress} />
        </div>
      </div>
    </main>
  )
}

useGLTF.preload("/man.glb")
