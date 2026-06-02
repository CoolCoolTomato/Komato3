import { Environment, useGLTF } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { Suspense, useCallback, useMemo, useRef, useState } from "react"
import type { Group, Object3D } from "three"
import { Box3, Color, Mesh, MeshPhysicalMaterial, Vector3 } from "three"
import nightEnvironmentUrl from "@/assets/dikhololo_night_1k.hdr?url"

function isMesh(object: Object3D): object is Mesh {
  return "isMesh" in object && object.isMesh === true
}

type TomatoMaterialMode = "glass" | "textured"

function TomatoModel({ materialMode }: { materialMode: TomatoMaterialMode }) {
  const groupRef = useRef<Group>(null)
  const { scene } = useGLTF("/tomato.glb")

  const tomatoScene = useMemo(() => {
    const clone = scene.clone(true)
    const glassMaterial = new MeshPhysicalMaterial({
      color: new Color("#ff3f32"),
      roughness: 0.08,
      metalness: 0,
      transmission: 0.62,
      thickness: 0.75,
      transparent: true,
      opacity: 0.58,
      ior: 1.35,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.5,
    })

    clone.traverse((child) => {
      if (isMesh(child)) {
        if (materialMode === "glass") {
          child.material = glassMaterial
        } else if (Array.isArray(child.material)) {
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
    clone.scale.setScalar(maxAxis > 0 ? 2.25 / maxAxis : 1)

    return clone
  }, [materialMode, scene])

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return
    }

    groupRef.current.rotation.y = clock.elapsedTime * 0.28
    groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.7) * 0.08
  })

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      <primitive object={tomatoScene} />
    </group>
  )
}

function TomatoScene({ materialMode }: { materialMode: TomatoMaterialMode }) {
  return (
    <>
      <color attach="background" args={["#ffffff"]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 5]} intensity={2.5} />
      <pointLight position={[-3, -2, 3]} color="#ff3f32" intensity={5} />
      <TomatoModel materialMode={materialMode} />
      <Environment files={nightEnvironmentUrl} />
    </>
  )
}

function TomatoCanvas({ materialMode }: { materialMode: TomatoMaterialMode }) {
  return (
    <Canvas
      className="pointer-events-none"
      camera={{ position: [0, 0.15, 4.3], fov: 34 }}
      dpr={[1, 2]}
      gl={{ alpha: false, antialias: true }}
    >
      <Suspense fallback={null}>
        <TomatoScene materialMode={materialMode} />
      </Suspense>
    </Canvas>
  )
}

export function TomatoScanModel() {
  const [split, setSplit] = useState(4)
  const [isDragging, setIsDragging] = useState(false)

  const updateSplit = useCallback((clientX: number, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect()
    const nextSplit = ((clientX - rect.left) / rect.width) * 100
    setSplit(Math.min(96, Math.max(4, nextSplit)))
  }, [])

  return (
    <div className="relative h-full min-h-64 w-full overflow-hidden bg-white">
      <div
        className="pointer-events-none absolute inset-0 p-10 md:p-0"
      >
        <TomatoCanvas materialMode="glass" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 p-10 md:p-0"
        style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
      >
        <TomatoCanvas materialMode="textured" />
      </div>
      <div
        className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-[#ff3f32]/20 shadow-[0_0_24px_rgba(255,63,50,0.55)]"
        style={{ left: `${split}%` }}
      ></div>
      <div
        className="absolute inset-0 z-20 cursor-ew-resize touch-none"
        onPointerDown={(event) => {
          setIsDragging(true)
          event.currentTarget.setPointerCapture(event.pointerId)
          updateSplit(event.clientX, event.currentTarget)
        }}
        onPointerMove={(event) => {
          if (isDragging) {
            updateSplit(event.clientX, event.currentTarget)
          }
        }}
        onPointerUp={(event) => {
          setIsDragging(false)
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
        }}
        onPointerCancel={(event) => {
          setIsDragging(false)
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
        }}
      />
    </div>
  )
}

useGLTF.preload("/tomato.glb")
