import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react"

import { getScrollContainer } from "@/lib/scroll"

export type WebGLBlurImageProps = {
  src: string
  alt?: string
  className?: string
  pixelSize?: number
  blurStrength?: number
  revealRadius?: number
  revealSoftness?: number
  glassStrength?: number
  noiseStrength?: number
  noiseScale?: number
  objectFit?: "cover" | "contain"
}

const vertexShaderSource = `
  attribute vec2 aPosition;
  attribute vec2 aUv;

  varying vec2 vUv;

  void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

const fragmentShaderSource = `
  precision mediump float;

  uniform sampler2D uTexture;

  uniform vec2 uCanvasSize;
  uniform vec2 uImageSize;
  uniform vec2 uMouse;

  uniform float uHover;
  uniform float uPixelSize;
  uniform float uBlurStrength;
  uniform float uRevealRadius;
  uniform float uRevealSoftness;
  uniform float uGlassStrength;
  uniform float uNoiseStrength;
  uniform float uNoiseScale;
  uniform float uObjectFitMode;

  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  vec2 getImageUv(vec2 uv) {
    float canvasAspect = uCanvasSize.x / uCanvasSize.y;
    float imageAspect = uImageSize.x / uImageSize.y;

    vec2 scale = vec2(1.0);

    if (uObjectFitMode < 0.5) {
      if (canvasAspect > imageAspect) {
        scale.y = imageAspect / canvasAspect;
      } else {
        scale.x = canvasAspect / imageAspect;
      }

      return (uv - 0.5) * scale + 0.5;
    }

    if (canvasAspect > imageAspect) {
      scale.x = imageAspect / canvasAspect;
    } else {
      scale.y = canvasAspect / imageAspect;
    }

    return (uv - 0.5) / scale + 0.5;
  }

  vec4 sampleImage(vec2 uv) {
    return texture2D(uTexture, clamp(uv, 0.001, 0.999));
  }

  vec4 blurSample(vec2 uv, float strength) {
    vec2 texel = 1.0 / uImageSize;
    vec4 color = vec4(0.0);

    color += sampleImage(uv + texel * vec2(-2.0, -2.0) * strength) * 0.06;
    color += sampleImage(uv + texel * vec2( 0.0, -2.0) * strength) * 0.09;
    color += sampleImage(uv + texel * vec2( 2.0, -2.0) * strength) * 0.06;
    color += sampleImage(uv + texel * vec2(-2.0,  0.0) * strength) * 0.09;
    color += sampleImage(uv) * 0.40;
    color += sampleImage(uv + texel * vec2( 2.0,  0.0) * strength) * 0.09;
    color += sampleImage(uv + texel * vec2(-2.0,  2.0) * strength) * 0.06;
    color += sampleImage(uv + texel * vec2( 0.0,  2.0) * strength) * 0.09;
    color += sampleImage(uv + texel * vec2( 2.0,  2.0) * strength) * 0.06;

    return color;
  }

  vec2 getPixelCanvasUv(vec2 uv) {
    vec2 pixelCount = uCanvasSize / uPixelSize;
    return (floor(uv * pixelCount) + 0.5) / pixelCount;
  }

  void main() {
    vec2 imageUv = getImageUv(vUv);

    if (
      imageUv.x < 0.0 ||
      imageUv.x > 1.0 ||
      imageUv.y < 0.0 ||
      imageUv.y > 1.0
    ) {
      discard;
    }

    vec2 pixelCanvasUv = getPixelCanvasUv(vUv);
    vec2 pixelImageUv = getImageUv(pixelCanvasUv);

    vec4 sharpColor = sampleImage(imageUv);
    vec4 pixelColor = sampleImage(pixelImageUv);
    vec4 blurColor = blurSample(pixelImageUv, uBlurStrength);
    vec4 frostedColor = mix(pixelColor, blurColor, 0.68);

    frostedColor.rgb = mix(frostedColor.rgb, vec3(1.0), uGlassStrength);
    frostedColor.rgb = mix(vec3(0.5), frostedColor.rgb, 0.82);

    float blockNoise = random(floor(vUv * uCanvasSize / uPixelSize));
    float grainNoise = random(vUv * uNoiseScale + blockNoise);
    float noise = mix(blockNoise, grainNoise, 0.45) * 2.0 - 1.0;

    frostedColor.rgb += noise * uNoiseStrength;

    float speckle = step(0.965, grainNoise);
    frostedColor.rgb -= speckle * uNoiseStrength * 2.2;
    frostedColor.rgb = clamp(frostedColor.rgb, 0.0, 1.0);

    float dist = distance(vUv, uMouse);
    float reveal = 1.0 - smoothstep(
      uRevealRadius,
      uRevealRadius + uRevealSoftness,
      dist
    );

    reveal *= uHover;

    gl_FragColor = mix(frostedColor, sharpColor, reveal);
  }
`

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)

  if (!shader) {
    throw new Error("Failed to create shader")
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(message ?? "Shader compile failed")
  }

  return shader
}

function createProgram(gl: WebGLRenderingContext) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  )
  const program = gl.createProgram()

  if (!program) {
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    throw new Error("Failed to create program")
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(message ?? "Program link failed")
  }

  return program
}

type ImageConfig = Required<
  Pick<
    WebGLBlurImageProps,
    | "src"
    | "pixelSize"
    | "blurStrength"
    | "revealRadius"
    | "revealSoftness"
    | "glassStrength"
    | "noiseStrength"
    | "noiseScale"
    | "objectFit"
  >
>

type SharedImageState = ImageConfig & {
  id: string
  element: HTMLElement
  image: HTMLImageElement
  imageWidth: number
  imageHeight: number
  loaded: boolean
  destroyed: boolean
  texture: WebGLTexture | null
  mouseX: number
  mouseY: number
  hover: number
  targetHover: number
}

type ProgramLocations = {
  position: number
  uv: number
  texture: WebGLUniformLocation | null
  canvasSize: WebGLUniformLocation | null
  imageSize: WebGLUniformLocation | null
  mouse: WebGLUniformLocation | null
  hover: WebGLUniformLocation | null
  pixelSize: WebGLUniformLocation | null
  blurStrength: WebGLUniformLocation | null
  revealRadius: WebGLUniformLocation | null
  revealSoftness: WebGLUniformLocation | null
  glassStrength: WebGLUniformLocation | null
  noiseStrength: WebGLUniformLocation | null
  noiseScale: WebGLUniformLocation | null
  objectFitMode: WebGLUniformLocation | null
}

type GLResources = {
  program: WebGLProgram
  buffer: WebGLBuffer
  locations: ProgramLocations
}

type SharedWebGLContextValue = {
  register: (id: string, element: HTMLElement, config: ImageConfig) => void
  unregister: (id: string) => void
  setPointer: (id: string, x: number, y: number) => void
  setHovered: (id: string, hovered: boolean) => void
}

const SharedWebGLContext = createContext<SharedWebGLContextValue | null>(null)

function getConfig({
  src,
  pixelSize = 18,
  blurStrength = 3.5,
  revealRadius = 0.16,
  revealSoftness = 0.18,
  glassStrength = 0.28,
  noiseStrength = 0.055,
  noiseScale = 420,
  objectFit = "cover",
}: WebGLBlurImageProps): ImageConfig {
  return {
    src,
    pixelSize,
    blurStrength,
    revealRadius,
    revealSoftness,
    glassStrength,
    noiseStrength,
    noiseScale,
    objectFit,
  }
}

function createResources(gl: WebGLRenderingContext): GLResources {
  const program = createProgram(gl)
  const buffer = gl.createBuffer()

  if (!buffer) {
    gl.deleteProgram(program)
    throw new Error("Failed to create buffer")
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, -1, 1, 0, 1, 1, -1, 1, 0, 1, 1, 1,
      1,
    ]),
    gl.STATIC_DRAW
  )

  return {
    program,
    buffer,
    locations: {
      position: gl.getAttribLocation(program, "aPosition"),
      uv: gl.getAttribLocation(program, "aUv"),
      texture: gl.getUniformLocation(program, "uTexture"),
      canvasSize: gl.getUniformLocation(program, "uCanvasSize"),
      imageSize: gl.getUniformLocation(program, "uImageSize"),
      mouse: gl.getUniformLocation(program, "uMouse"),
      hover: gl.getUniformLocation(program, "uHover"),
      pixelSize: gl.getUniformLocation(program, "uPixelSize"),
      blurStrength: gl.getUniformLocation(program, "uBlurStrength"),
      revealRadius: gl.getUniformLocation(program, "uRevealRadius"),
      revealSoftness: gl.getUniformLocation(program, "uRevealSoftness"),
      glassStrength: gl.getUniformLocation(program, "uGlassStrength"),
      noiseStrength: gl.getUniformLocation(program, "uNoiseStrength"),
      noiseScale: gl.getUniformLocation(program, "uNoiseScale"),
      objectFitMode: gl.getUniformLocation(program, "uObjectFitMode"),
    },
  }
}

type SharedWebGLBlurCanvasProps = {
  children: ReactNode
  className?: string
  containerRef?: RefObject<HTMLDivElement | null>
}

export function SharedWebGLBlurCanvas({
  children,
  className = "",
  containerRef,
}: SharedWebGLBlurCanvasProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const itemsRef = useRef(new Map<string, SharedImageState>())
  const uploadTextureRef = useRef<(item: SharedImageState) => void>(() => {})
  const deleteTextureRef = useRef<(item: SharedImageState) => void>(() => {})

  const unregister = useCallback((id: string) => {
    const item = itemsRef.current.get(id)

    if (!item) return

    item.destroyed = true
    item.image.onload = null
    item.image.onerror = null

    if (!item.image.complete) {
      item.image.src = ""
    }

    deleteTextureRef.current(item)
    itemsRef.current.delete(id)
  }, [])

  const register = useCallback(
    (id: string, element: HTMLElement, config: ImageConfig) => {
      unregister(id)

      const image = new Image()
      image.crossOrigin = "anonymous"

      const item: SharedImageState = {
        ...config,
        id,
        element,
        image,
        imageWidth: 1,
        imageHeight: 1,
        loaded: false,
        destroyed: false,
        texture: null,
        mouseX: 0.5,
        mouseY: 0.5,
        hover: 0,
        targetHover: 0,
      }

      itemsRef.current.set(id, item)

      image.onload = () => {
        if (item.destroyed) return

        item.imageWidth = image.naturalWidth || 1
        item.imageHeight = image.naturalHeight || 1
        item.loaded = true
        uploadTextureRef.current(item)
      }

      image.onerror = () => {
        if (!item.destroyed) {
          item.loaded = false
        }
      }

      image.src = config.src
    },
    [unregister]
  )

  const setPointer = useCallback((id: string, x: number, y: number) => {
    const item = itemsRef.current.get(id)

    if (!item) return

    item.mouseX = Math.min(Math.max(x, 0), 1)
    item.mouseY = Math.min(Math.max(y, 0), 1)
  }, [])

  const setHovered = useCallback((id: string, hovered: boolean) => {
    const item = itemsRef.current.get(id)

    if (item) {
      item.targetHover = hovered ? 1 : 0
    }
  }, [])

  const contextValue = useMemo(
    () => ({ register, unregister, setPointer, setHovered }),
    [register, unregister, setPointer, setHovered]
  )

  const setRoot = useCallback(
    (element: HTMLDivElement | null) => {
      rootRef.current = element

      if (containerRef) {
        containerRef.current = element
      }
    },
    [containerRef]
  )

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current

    if (!root || !canvas) return

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    })

    if (!gl) return

    const items = itemsRef.current
    let resources: GLResources | null = null
    let animationFrame: number | null = null
    let destroyed = false
    let contextLost = false
    let visible = true

    const scrollContainer = getScrollContainer(root)

    const deleteTexture = (item: SharedImageState) => {
      if (item.texture && !contextLost) {
        gl.deleteTexture(item.texture)
      }

      item.texture = null
    }

    const uploadTexture = (item: SharedImageState) => {
      if (!resources || contextLost || !item.loaded || item.destroyed) return

      deleteTexture(item)

      const texture = gl.createTexture()

      if (!texture) return

      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        item.image
      )

      item.texture = texture
    }

    uploadTextureRef.current = uploadTexture
    deleteTextureRef.current = deleteTexture

    const destroyResources = () => {
      items.forEach((item) => deleteTexture(item))

      if (resources && !contextLost) {
        gl.deleteBuffer(resources.buffer)
        gl.deleteProgram(resources.program)
      }

      resources = null
    }

    const initializeResources = () => {
      destroyResources()
      resources = createResources(gl)
      items.forEach((item) => uploadTexture(item))
    }

    const stopRender = () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame)
        animationFrame = null
      }
    }

    const render = () => {
      animationFrame = null

      if (destroyed || contextLost || !visible || !resources) return

      const activeResources = resources
      const rootRect = root.getBoundingClientRect()
      const clippingRect = scrollContainer?.getBoundingClientRect()
      const clipTop = Math.max(clippingRect?.top ?? 0, 0)
      const clipBottom = Math.min(
        clippingRect?.bottom ?? window.innerHeight,
        window.innerHeight
      )
      const visibleTop = Math.max(rootRect.top, clipTop)
      const visibleBottom = Math.min(rootRect.bottom, clipBottom)
      const cssWidth = Math.max(rootRect.width, 1)
      const cssHeight = Math.max(visibleBottom - visibleTop, 1)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const pixelWidth = Math.max(Math.round(cssWidth * dpr), 1)
      const pixelHeight = Math.max(Math.round(cssHeight * dpr), 1)

      canvas.style.top = `${Math.max(visibleTop - rootRect.top, 0)}px`
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = `${cssHeight}px`

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth
        canvas.height = pixelHeight
      }

      gl.disable(gl.SCISSOR_TEST)
      gl.viewport(0, 0, pixelWidth, pixelHeight)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.enable(gl.SCISSOR_TEST)
      gl.useProgram(activeResources.program)
      gl.bindBuffer(gl.ARRAY_BUFFER, activeResources.buffer)

      if (activeResources.locations.position >= 0) {
        gl.enableVertexAttribArray(activeResources.locations.position)
        gl.vertexAttribPointer(
          activeResources.locations.position,
          2,
          gl.FLOAT,
          false,
          16,
          0
        )
      }

      if (activeResources.locations.uv >= 0) {
        gl.enableVertexAttribArray(activeResources.locations.uv)
        gl.vertexAttribPointer(
          activeResources.locations.uv,
          2,
          gl.FLOAT,
          false,
          16,
          8
        )
      }

      items.forEach((item) => {
        item.hover += (item.targetHover - item.hover) * 0.09

        if (!item.texture || item.destroyed) return

        const rect = item.element.getBoundingClientRect()
        const left = Math.max(rect.left, rootRect.left)
        const right = Math.min(rect.right, rootRect.right)
        const top = Math.max(rect.top, visibleTop)
        const bottom = Math.min(rect.bottom, visibleBottom)

        if (right <= left || bottom <= top) return

        const viewportX = Math.round((rect.left - rootRect.left) * dpr)
        const viewportY = Math.round((visibleBottom - rect.bottom) * dpr)
        const viewportWidth = Math.max(Math.round(rect.width * dpr), 1)
        const viewportHeight = Math.max(Math.round(rect.height * dpr), 1)
        const scissorX = Math.max(Math.round((left - rootRect.left) * dpr), 0)
        const scissorY = Math.max(Math.round((visibleBottom - bottom) * dpr), 0)
        const scissorWidth = Math.max(Math.round((right - left) * dpr), 1)
        const scissorHeight = Math.max(Math.round((bottom - top) * dpr), 1)

        gl.viewport(viewportX, viewportY, viewportWidth, viewportHeight)
        gl.scissor(scissorX, scissorY, scissorWidth, scissorHeight)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, item.texture)
        gl.uniform1i(activeResources.locations.texture, 0)
        gl.uniform2f(
          activeResources.locations.canvasSize,
          viewportWidth,
          viewportHeight
        )
        gl.uniform2f(
          activeResources.locations.imageSize,
          item.imageWidth,
          item.imageHeight
        )
        gl.uniform2f(activeResources.locations.mouse, item.mouseX, item.mouseY)
        gl.uniform1f(activeResources.locations.hover, item.hover)
        gl.uniform1f(activeResources.locations.pixelSize, item.pixelSize)
        gl.uniform1f(activeResources.locations.blurStrength, item.blurStrength)
        gl.uniform1f(activeResources.locations.revealRadius, item.revealRadius)
        gl.uniform1f(
          activeResources.locations.revealSoftness,
          item.revealSoftness
        )
        gl.uniform1f(
          activeResources.locations.glassStrength,
          item.glassStrength
        )
        gl.uniform1f(
          activeResources.locations.noiseStrength,
          item.noiseStrength
        )
        gl.uniform1f(activeResources.locations.noiseScale, item.noiseScale)
        gl.uniform1f(
          activeResources.locations.objectFitMode,
          item.objectFit === "cover" ? 0 : 1
        )
        gl.drawArrays(gl.TRIANGLES, 0, 6)
      })

      gl.disable(gl.SCISSOR_TEST)
      animationFrame = window.requestAnimationFrame(render)
    }

    const startRender = () => {
      if (
        animationFrame === null &&
        !destroyed &&
        !contextLost &&
        visible &&
        resources
      ) {
        animationFrame = window.requestAnimationFrame(render)
      }
    }

    const handleContextLost = (event: Event) => {
      event.preventDefault()
      contextLost = true
      stopRender()
      resources = null
      items.forEach((item) => {
        item.texture = null
      })
    }

    const handleContextRestored = () => {
      if (destroyed) return

      contextLost = false

      try {
        initializeResources()
        startRender()
      } catch (error) {
        console.error("Unable to restore shared WebGL blur canvas:", error)
      }
    }

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false

      if (visible) {
        startRender()
      } else {
        stopRender()
      }
    })

    const resizeObserver = new ResizeObserver(startRender)

    canvas.addEventListener("webglcontextlost", handleContextLost)
    canvas.addEventListener("webglcontextrestored", handleContextRestored)
    intersectionObserver.observe(root)
    resizeObserver.observe(root)
    window.addEventListener("resize", startRender)

    try {
      initializeResources()
      startRender()
    } catch (error) {
      console.error("Unable to initialize shared WebGL blur canvas:", error)
    }

    return () => {
      destroyed = true
      stopRender()
      intersectionObserver.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener("resize", startRender)
      canvas.removeEventListener("webglcontextlost", handleContextLost)
      canvas.removeEventListener("webglcontextrestored", handleContextRestored)

      items.forEach((item) => {
        item.destroyed = true
        item.image.onload = null
        item.image.onerror = null

        if (!item.image.complete) {
          item.image.src = ""
        }
      })

      destroyResources()
      uploadTextureRef.current = () => {}
      deleteTextureRef.current = () => {}
    }
  }, [])

  return (
    <SharedWebGLContext.Provider value={contextValue}>
      <div ref={setRoot} className={className}>
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 z-10 block"
        />
        {children}
      </div>
    </SharedWebGLContext.Provider>
  )
}

export function SharedWebGLBlurImage(props: WebGLBlurImageProps) {
  const {
    src,
    alt = "",
    className = "",
    pixelSize,
    blurStrength,
    revealRadius,
    revealSoftness,
    glassStrength,
    noiseStrength,
    noiseScale,
    objectFit,
  } = props
  const context = useContext(SharedWebGLContext)
  const elementRef = useRef<HTMLDivElement | null>(null)
  const id = useId()
  const config = useMemo(
    () =>
      getConfig({
        src,
        pixelSize,
        blurStrength,
        revealRadius,
        revealSoftness,
        glassStrength,
        noiseStrength,
        noiseScale,
        objectFit,
      }),
    [
      src,
      pixelSize,
      blurStrength,
      revealRadius,
      revealSoftness,
      glassStrength,
      noiseStrength,
      noiseScale,
      objectFit,
    ]
  )

  useEffect(() => {
    const element = elementRef.current

    if (!context || !element) return

    context.register(id, element, config)

    return () => {
      context.unregister(id)
    }
  }, [config, context, id])

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()

    context?.setPointer(
      id,
      (event.clientX - rect.left) / Math.max(rect.width, 1),
      1 - (event.clientY - rect.top) / Math.max(rect.height, 1)
    )
  }

  return (
    <div
      ref={elementRef}
      role="img"
      aria-label={alt}
      className={`block bg-white ${className}`}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => context?.setHovered(id, true)}
      onPointerLeave={() => context?.setHovered(id, false)}
    />
  )
}

export default function WebGLBlurImage(props: WebGLBlurImageProps) {
  return (
    <SharedWebGLBlurCanvas className="relative h-full w-full overflow-hidden">
      <SharedWebGLBlurImage {...props} />
    </SharedWebGLBlurCanvas>
  )
}
