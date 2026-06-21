import { useEffect, useRef } from "react"
import * as THREE from "three"

import { clamp, getScrollContainer } from "@/lib/scroll"

type BlogMosaicCanvasProps = {
  className?: string
}

export function BlogMosaicCanvas({
  className = "relative aspect-square w-[calc(100svh-60px)] overflow-hidden bg-black",
}: BlogMosaicCanvasProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const wrapElement = wrap
    const scene = new THREE.Scene()

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000)
    camera.position.z = 10

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    })

    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.className = "absolute inset-0 h-full w-full"
    wrapElement.appendChild(renderer.domElement)

    let frameId = 0
    let resizeFrameId = 0

    let mesh: THREE.InstancedMesh | null = null
    let material: THREE.ShaderMaterial | null = null
    let texture: THREE.Texture | null = null

    const mouseTarget = new THREE.Vector2(0, 0)
    const mouseEased = new THREE.Vector2(0, 0)

    let mouseActiveTarget = 0
    let mouseActive = 0

    let revealProgressTarget = 0
    let revealProgress = 0

    const dummy = new THREE.Object3D()

    const uniforms = {
      uTexture: { value: null as THREE.Texture | null },
      uGrid: { value: new THREE.Vector2(1, 1) },
      uPlaneSize: { value: new THREE.Vector2(1, 1) },
      uImageSize: { value: new THREE.Vector2(1, 1) },
      uMouseLocal: { value: new THREE.Vector2(0, 0) },
      uMouseRadius: { value: 160 },
      uMaxOffset: { value: 26 },
      uMouseActive: { value: 0 },
      uRevealProgress: { value: 0 },
      uTileScale: { value: 0.95 },
      uHoverScale: { value: 0.09 },
      uLineColor: { value: new THREE.Color("#ff3f32") },
    }

    const vertexShader = `
      attribute vec2 aGridPos;
      attribute float aSeed;
      attribute float aRevealOrder;

      uniform vec2 uGrid;
      uniform vec2 uMouseLocal;
      uniform float uMouseRadius;
      uniform float uMaxOffset;
      uniform float uMouseActive;
      uniform float uTileScale;
      uniform float uHoverScale;
      uniform float uRevealProgress;

      varying vec2 vTexUv;
      varying vec2 vBlockUv;
      varying float vEffect;
      varying float vSeed;
      varying float vReveal;

      void main() {
        vec2 blockUv = (aGridPos + uv) / uGrid;

        vTexUv = blockUv;
        vBlockUv = uv;
        vSeed = aSeed;

        vec2 blockCenter = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xy;
        vec2 fromCursor = blockCenter - uMouseLocal;

        float dist = length(fromCursor);
        float proximity = 1.0 - smoothstep(0.0, uMouseRadius, dist);
        float coreHole = smoothstep(0.0, uMouseRadius * 0.22, dist);
        float effect = proximity * coreHole * uMouseActive;

        float reveal = smoothstep(
          aRevealOrder,
          aRevealOrder + 0.18,
          uRevealProgress
        );

        vec2 repelDir = dist > 0.001 ? fromCursor / dist : vec2(0.0, 1.0);

        vec3 localPos = position;

        localPos.xy *= 
          (uTileScale + effect * uHoverScale) *
          mix(0.72, 1.0, reveal);

        vec4 worldPos = instanceMatrix * vec4(localPos, 1.0);

        worldPos.xy += repelDir * uMaxOffset * effect * mix(0.75, 1.2, aSeed);
        worldPos.y += (1.0 - reveal) * -28.0 * mix(0.4, 1.25, aSeed);

        vEffect = effect;
        vReveal = reveal;

        gl_Position = projectionMatrix * modelViewMatrix * worldPos;
      }
    `

    const fragmentShader = `
      uniform sampler2D uTexture;
      uniform vec2 uPlaneSize;
      uniform vec2 uImageSize;
      uniform vec3 uLineColor;

      varying vec2 vTexUv;
      varying vec2 vBlockUv;
      varying float vEffect;
      varying float vSeed;
      varying float vReveal;

      vec2 getCoverUv(vec2 uv) {
        float planeAspect = uPlaneSize.x / uPlaneSize.y;
        float imageAspect = uImageSize.x / uImageSize.y;

        vec2 scale = vec2(1.0);

        if (planeAspect > imageAspect) {
          scale.y = imageAspect / planeAspect;
        } else {
          scale.x = planeAspect / imageAspect;
        }

        return (uv - 0.5) * scale + 0.5;
      }

      void main() {
        vec2 uv = getCoverUv(vTexUv);
        uv = clamp(uv, 0.001, 0.999);

        vec3 col = texture2D(uTexture, uv).rgb;

        vec2 edgeDist = min(vBlockUv, 1.0 - vBlockUv);
        float edgeMin = min(edgeDist.x, edgeDist.y);

        float gap = pow(
          1.0 - smoothstep(0.0, 0.12, edgeMin),
          3.0
        );

        float baseGap = gap * 0.9;
        col = mix(col, vec3(0.0), baseGap);

        float hoverGap = gap * vEffect * 0.55;
        col = mix(col, uLineColor, hoverGap * 0.45);

        gl_FragColor = vec4(clamp(col, 0.0, 1.0), vReveal);
      }
    `

    function disposeMesh() {
      if (mesh) {
        scene.remove(mesh)
        mesh.geometry.dispose()
        mesh = null
      }

      if (material) {
        material.dispose()
        material = null
      }
    }

    function buildMesh() {
      if (!texture) return

      disposeMesh()

      const rect = wrapElement.getBoundingClientRect()
      const width = Math.max(rect.width, 1)
      const height = Math.max(rect.height, 1)

      renderer.setSize(width, height, false)

      camera.left = -width / 2
      camera.right = width / 2
      camera.top = height / 2
      camera.bottom = -height / 2
      camera.updateProjectionMatrix()

      const cols = width < 640 ? 23 : 36
      const cellSize = width / cols
      const rows = Math.max(1, Math.round(height / cellSize))
      const count = cols * rows

      uniforms.uGrid.value.set(cols, rows)
      uniforms.uPlaneSize.value.set(width, height)
      uniforms.uTexture.value = texture

      const geometry = new THREE.PlaneGeometry(1, 1)
      const gridPositions = new Float32Array(count * 2)
      const seeds = new Float32Array(count)
      const revealOrders = new Float32Array(count)

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const index = y * cols + x

          gridPositions[index * 2] = x
          gridPositions[index * 2 + 1] = rows - 1 - y

          const seed = Math.random()
          seeds[index] = seed

          const normalizedY = y / Math.max(rows - 1, 1)
          const randomOffset = (Math.random() - 0.5) * 0.34
          const revealDuration = 0.18

          revealOrders[index] = clamp(
            normalizedY + randomOffset,
            0,
            1 - revealDuration,
          )
        }
      }

      geometry.setAttribute(
        "aGridPos",
        new THREE.InstancedBufferAttribute(gridPositions, 2),
      )
      geometry.setAttribute(
        "aSeed",
        new THREE.InstancedBufferAttribute(seeds, 1),
      )
      geometry.setAttribute(
        "aRevealOrder",
        new THREE.InstancedBufferAttribute(revealOrders, 1),
      )

      material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
      })

      mesh = new THREE.InstancedMesh(geometry, material, count)
      mesh.frustumCulled = false

      const cellW = width / cols
      const cellH = height / rows

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const index = y * cols + x
          const px = (x + 0.5 - cols / 2) * cellW
          const py = (rows / 2 - y - 0.5) * cellH

          dummy.position.set(px, py, 0)
          dummy.scale.set(cellW, cellH, 1)
          dummy.rotation.set(0, 0, 0)
          dummy.updateMatrix()

          mesh.setMatrixAt(index, dummy.matrix)
        }
      }

      mesh.instanceMatrix.needsUpdate = true
      scene.add(mesh)
    }

    function scheduleBuildMesh() {
      cancelAnimationFrame(resizeFrameId)
      resizeFrameId = requestAnimationFrame(buildMesh)
    }

    const loader = new THREE.TextureLoader()

    loader.load("/blog.png", (loadedTexture) => {
      texture = loadedTexture
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.generateMipmaps = false

      const image = loadedTexture.image as HTMLImageElement | ImageBitmap
      uniforms.uImageSize.value.set(image.width || 1, image.height || 1)

      buildMesh()
    })

    function handleMouseMove(event: MouseEvent) {
      const rect = wrapElement.getBoundingClientRect()

      mouseTarget.x = event.clientX - rect.left - rect.width / 2
      mouseTarget.y = -(event.clientY - rect.top - rect.height / 2)
      mouseActiveTarget = 1
    }

    function handleMouseLeave() {
      mouseActiveTarget = 0
    }

    const scrollContainer = getScrollContainer(wrapElement)
    const scrollSection = Array.from(scrollContainer?.children ?? []).find(
      (child) => child.contains(wrapElement),
    ) as HTMLElement | undefined

    function updateReveal() {
      if (!scrollContainer || !scrollSection) {
        revealProgressTarget = 1
        return
      }

      const start = scrollSection.offsetTop - scrollContainer.clientHeight
      const end = scrollSection.offsetTop

      revealProgressTarget = clamp(
        (scrollContainer.scrollTop - start) / Math.max(end - start, 1),
        0,
        1,
      )
    }

    function animate() {
      frameId = requestAnimationFrame(animate)

      mouseEased.x += (mouseTarget.x - mouseEased.x) * 0.16
      mouseEased.y += (mouseTarget.y - mouseEased.y) * 0.16
      mouseActive += (mouseActiveTarget - mouseActive) * 0.12
      revealProgress += (revealProgressTarget - revealProgress) * 0.16

      uniforms.uMouseLocal.value.copy(mouseEased)
      uniforms.uMouseActive.value = mouseActive
      uniforms.uRevealProgress.value = revealProgress

      renderer.render(scene, camera)
    }

    const resizeObserver = new ResizeObserver(scheduleBuildMesh)

    resizeObserver.observe(wrapElement)
    wrapElement.addEventListener("mousemove", handleMouseMove)
    wrapElement.addEventListener("mouseleave", handleMouseLeave)

    updateReveal()

    scrollContainer?.addEventListener("scroll", updateReveal, {
      passive: true,
    })
    window.addEventListener("resize", updateReveal)

    animate()

    return () => {
      cancelAnimationFrame(frameId)
      cancelAnimationFrame(resizeFrameId)

      resizeObserver.disconnect()
      wrapElement.removeEventListener("mousemove", handleMouseMove)
      wrapElement.removeEventListener("mouseleave", handleMouseLeave)

      scrollContainer?.removeEventListener("scroll", updateReveal)
      window.removeEventListener("resize", updateReveal)

      disposeMesh()
      texture?.dispose()
      renderer.dispose()

      if (renderer.domElement.parentElement === wrapElement) {
        wrapElement.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className={className}
    />
  )
}
