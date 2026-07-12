import { useEffect, useRef, useState } from "react"

import { clamp, getScrollContainer } from "@/lib/scroll"

const revealStartProgress = 0.25
const imageInset = 30
const imageStartScale = 1.5

const revealDamping = 0.3
const switchDamping = 0.14

/**
 * 首图井字框完全展开后，先保留一段静止滚动距离。
 */
export const productInitialRestScrollVh = 70

/**
 * 每张图片切换占用 120svh：
 * 前 100svh 播放 dither，后 20svh 保持静止。
 */
export const productSwitchScrollVh = 170

const productDitherScrollVh = 100

const ditherEndProgress = productDitherScrollVh / productSwitchScrollVh

export type ProductRevealImage = {
  src: string
  alt: string
}

type ProductRevealFrameProps = {
  images: ProductRevealImage[]
  onActiveIndexChange?: (index: number) => void
}

type LoadedTexture = {
  texture: WebGLTexture
  width: number
  height: number
}

type ImageTransitionState = {
  fromIndex: number
  toIndex: number

  /**
   * 当前 120svh 区间内的原始进度。
   *
   * 0 -> 区间开始
   * 1 -> 区间结束
   */
  segmentProgress: number

  /**
   * dither 动画进度。
   *
   * 前 100svh：0 -> 1
   * 后 20svh：始终保持 1
   */
  ditherProgress: number

  /**
   * 当前是否已经进入最后 20svh 静止区。
   */
  isResting: boolean
}

function resolveImageTransition(
  overallProgress: number,
  imageCount: number,
): ImageTransitionState {
  if (imageCount <= 1) {
    return {
      fromIndex: 0,
      toIndex: 0,
      segmentProgress: 1,
      ditherProgress: 1,
      isResting: true,
    }
  }

  const maxProgress = imageCount - 1

  const progress = clamp(
    overallProgress,
    0,
    maxProgress,
  )

  /**
   * 最后一张图片已经完全显示。
   */
  if (progress >= maxProgress) {
    return {
      fromIndex: maxProgress,
      toIndex: maxProgress,
      segmentProgress: 1,
      ditherProgress: 1,
      isResting: true,
    }
  }

  const fromIndex = Math.floor(progress)

  const toIndex = Math.min(
    fromIndex + 1,
    maxProgress,
  )

  const segmentProgress =
    progress - fromIndex

  /**
   * segmentProgress 的前 5/6 对应 100svh。
   *
   * 0        -> dither 0
   * 5/6      -> dither 1
   * 5/6 到 1 -> dither 始终保持 1
   */
  const ditherProgress = clamp(
    segmentProgress /
      Math.max(ditherEndProgress, 0.001),
    0,
    1,
  )

  return {
    fromIndex,
    toIndex,
    segmentProgress,
    ditherProgress,
    isResting:
      segmentProgress >= ditherEndProgress,
  }
}

const vertexShaderSource = `
  attribute vec2 aPosition;

  varying vec2 vUv;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

const fragmentShaderSource = `
  precision highp float;

  varying vec2 vUv;

  uniform sampler2D uTextureFrom;
  uniform sampler2D uTextureTo;

  uniform vec2 uViewportSize;
  uniform vec2 uTextureFromSize;
  uniform vec2 uTextureToSize;

  uniform float uProgress;
  uniform float uPixelRatio;

  float hash21(vec2 value) {
    value = fract(
      value * vec2(123.34, 456.21)
    );

    value += dot(
      value,
      value + 45.32
    );

    return fract(
      value.x * value.y
    );
  }

  vec2 getCoverUv(
    vec2 uv,
    vec2 viewportSize,
    vec2 textureSize
  ) {
    float viewportAspect =
      viewportSize.x /
      max(viewportSize.y, 1.0);

    float textureAspect =
      textureSize.x /
      max(textureSize.y, 1.0);

    vec2 scale = vec2(1.0);

    if (
      viewportAspect <
      textureAspect
    ) {
      scale.x =
        viewportAspect /
        textureAspect;
    } else {
      scale.y =
        textureAspect /
        viewportAspect;
    }

    return (
      uv - 0.5
    ) * scale + 0.5;
  }

  void main() {
    /*
     * 使用固定尺寸的屏幕像素网格。
     * 粒子不会移动，也不会改变网格位置。
     */
    float particleSize = 6.0;

    vec2 cssPixel =
      gl_FragCoord.xy /
      max(uPixelRatio, 1.0);

    vec2 particleCell =
      floor(
        cssPixel /
        particleSize
      );

    vec2 particleUv =
      fract(
        cssPixel /
        particleSize
      );

    /*
     * 每个固定网格单元都有自己的随机切换阈值。
     */
    float fineNoise =
      hash21(particleCell);

    float macroNoise =
      hash21(
        floor(
          particleCell / 4.0
        ) + 19.4
      );

    float threshold = clamp(
      fineNoise * 0.78 +
      macroNoise * 0.22,
      0.0,
      1.0
    );

    /*
     * 达到该粒子的阈值时，
     * 该格子由旧图片切换成新图片。
     */
    float transitionMix =
      smoothstep(
        threshold - 0.025,
        threshold + 0.025,
        uProgress
      );

    /*
     * 只有当前正在切换的格子产生粒子中间态。
     */
    float transitionActivity =
      1.0 -
      smoothstep(
        0.0,
        0.085,
        abs(
          uProgress -
          threshold
        )
      );

    vec2 fromUv = getCoverUv(
      vUv,
      uViewportSize,
      uTextureFromSize
    );

    vec2 toUv = getCoverUv(
      vUv,
      uViewportSize,
      uTextureToSize
    );

    /*
     * 两张图片使用相同坐标采样，
     * 所以不存在平移、抖动或扭曲。
     */
    vec3 fromColor =
      texture2D(
        uTextureFrom,
        fromUv
      ).rgb;

    vec3 toColor =
      texture2D(
        uTextureTo,
        toUv
      ).rgb;

    if (uProgress <= 0.001) {
      gl_FragColor =
        vec4(fromColor, 1.0);

      return;
    }

    if (uProgress >= 0.999) {
      gl_FragColor =
        vec4(toColor, 1.0);

      return;
    }

    vec3 color = mix(
      fromColor,
      toColor,
      transitionMix
    );

    /*
     * 在固定网格单元内部形成小方形粒子。
     * 粒子只改变亮度，不改变坐标。
     */
    float particleShape =
      step(0.14, particleUv.x) *
      step(0.14, particleUv.y) *
      step(particleUv.x, 0.86) *
      step(particleUv.y, 0.86);

    float luminance = dot(
      color,
      vec3(
        0.299,
        0.587,
        0.114
      )
    );

    /*
     * 切换边缘稍微去色，
     * 形成更明显的数字 dither 中间态。
     */
    color = mix(
      color,
      vec3(luminance),
      transitionActivity * 0.28
    );

    /*
     * 粒子在原位置出现。
     */
    float brightParticle =
      transitionActivity *
      particleShape *
      step(0.35, fineNoise);

    /*
     * 部分网格形成暗粒子，
     * 加强图片被打散的感觉。
     */
    float darkParticle =
      transitionActivity *
      step(
        0.82,
        hash21(
          particleCell * 1.73 +
          8.4
        )
      );

    color +=
      brightParticle * 0.13;

    color *=
      1.0 -
      darkParticle * 0.32;

    gl_FragColor =
      vec4(color, 1.0);
  }
`

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type)

  if (!shader) {
    throw new Error("Unable to create WebGL shader.")
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message =
      gl.getShaderInfoLog(shader) ??
      "Unknown WebGL shader compilation error."

    gl.deleteShader(shader)
    throw new Error(message)
  }

  return shader
}

function createProgram(gl: WebGLRenderingContext) {
  const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource,
  )

  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource,
  )

  const program = gl.createProgram()

  if (!program) {
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

    throw new Error("Unable to create WebGL program.")
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message =
      gl.getProgramInfoLog(program) ??
      "Unknown WebGL program linking error."

    gl.deleteProgram(program)
    throw new Error(message)
  }

  return program
}

function loadTexture(
  gl: WebGLRenderingContext,
  src: string,
): Promise<LoadedTexture> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.decoding = "async"
    image.crossOrigin = "anonymous"

    image.onload = () => {
      const texture = gl.createTexture()

      if (!texture) {
        reject(new Error(`Unable to create texture: ${src}`))
        return
      }

      gl.bindTexture(gl.TEXTURE_2D, texture)

      gl.pixelStorei(
        gl.UNPACK_FLIP_Y_WEBGL,
        1,
      )

      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_S,
        gl.CLAMP_TO_EDGE,
      )

      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_T,
        gl.CLAMP_TO_EDGE,
      )

      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR,
      )

      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MAG_FILTER,
        gl.LINEAR,
      )

      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      )

      gl.bindTexture(gl.TEXTURE_2D, null)

      resolve({
        texture,
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    }

    image.onerror = () => {
      reject(new Error(`Unable to load image: ${src}`))
    }

    image.src = src
  })
}

function getElementTopInsideContainer(
  element: HTMLElement,
  container: HTMLElement,
) {
  const elementRect = element.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()

  return (
    container.scrollTop +
    elementRect.top -
    containerRect.top
  )
}

function damp(
  current: number,
  target: number,
  damping: number,
) {
  const next =
    current + (target - current) * damping

  return Math.abs(target - next) < 0.0005
    ? target
    : next
}

export function ProductRevealFrame({
  images,
  onActiveIndexChange,
}: ProductRevealFrameProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const clipRef = useRef<HTMLDivElement>(null)
  const scaleLayerRef = useRef<HTMLDivElement>(null)
  const rightLineRef = useRef<HTMLDivElement>(null)
  const bottomLineRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const sizeRef = useRef({
    width: 0,
    height: 0,
  })

  const targetRevealProgressRef = useRef(0)
  const revealProgressRef = useRef(0)

  const targetSwitchProgressRef = useRef(0)
  const switchProgressRef = useRef(0)

  const activeIndexRef = useRef(-1)
  const onActiveIndexChangeRef = useRef(
    onActiveIndexChange,
  )

  const [webglReady, setWebglReady] =
    useState(false)

  useEffect(() => {
    onActiveIndexChangeRef.current =
      onActiveIndexChange
  }, [onActiveIndexChange])

  useEffect(() => {
    const root = rootRef.current

    if (!root) {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) {
        return
      }

      sizeRef.current = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }
    })

    observer.observe(root)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current

    if (!root) {
      return
    }

    const scrollSection =
      root.closest<HTMLElement>(
        "[data-product-reveal-section]",
      )

    if (!scrollSection) {
      return
    }

    const container = getScrollContainer(root)

    if (!container) {
      return
    }

    const updateProgress = () => {
      const viewportHeight = Math.max(
        container.clientHeight,
        1,
      )

      const sectionTop =
        getElementTopInsideContainer(
          scrollSection,
          container,
        )

      /**
       * Section 从视口底部进入到顶部抵达视口顶部，
       * 负责第一张图片的初次展开。
       */
      const revealRawProgress = clamp(
        (
          container.scrollTop -
          (sectionTop - viewportHeight)
        ) / viewportHeight,
        0,
        1,
      )

      targetRevealProgressRef.current =
        clamp(
          (
            revealRawProgress -
            revealStartProgress
          ) /
            (1 - revealStartProgress),
          0,
          1,
        )

      /**
       * 井字框完全展开并吸顶后，先静止 20svh，
       * 然后每经过 120svh 完成一次图片切换：
       * 前 100svh 播放 dither，后 20svh 保持新图静止。
       */
      const initialRestDistance =
        viewportHeight *
        (productInitialRestScrollVh / 100)

      const switchScrollDistance =
        viewportHeight *
        (productSwitchScrollVh / 100)

      const switchScrollTop =
        container.scrollTop -
        sectionTop -
        initialRestDistance

      targetSwitchProgressRef.current =
        clamp(
          switchScrollTop /
            Math.max(switchScrollDistance, 1),
          0,
          Math.max(images.length - 1, 0),
        )
    }

    updateProgress()

    container.addEventListener(
      "scroll",
      updateProgress,
      { passive: true },
    )

    window.addEventListener(
      "resize",
      updateProgress,
    )

    return () => {
      container.removeEventListener(
        "scroll",
        updateProgress,
      )

      window.removeEventListener(
        "resize",
        updateProgress,
      )
    }
  }, [images.length])

  useEffect(() => {
    let animationFrame = 0

    const animate = () => {
      revealProgressRef.current = damp(
        revealProgressRef.current,
        targetRevealProgressRef.current,
        revealDamping,
      )

      switchProgressRef.current = damp(
        switchProgressRef.current,
        targetSwitchProgressRef.current,
        switchDamping,
      )

      const { width, height } =
        sizeRef.current

      const imageWidth = Math.max(
        width - imageInset * 2,
        0,
      )

      const imageHeight = Math.max(
        height - imageInset * 2,
        0,
      )

      const revealProgress =
        revealProgressRef.current

      const revealWidth =
        imageWidth * revealProgress

      const revealHeight =
        imageHeight * revealProgress

      const imageScale =
        imageStartScale -
        (imageStartScale - 1) *
          revealProgress

      if (clipRef.current) {
        clipRef.current.style.left =
          `${imageInset}px`

        clipRef.current.style.top =
          `${imageInset}px`

        clipRef.current.style.width =
          `${revealWidth}px`

        clipRef.current.style.height =
          `${revealHeight}px`
      }

      if (scaleLayerRef.current) {
        scaleLayerRef.current.style.width =
          `${imageWidth}px`

        scaleLayerRef.current.style.height =
          `${imageHeight}px`

        scaleLayerRef.current.style.transform =
          `scale(${imageScale})`
      }

      if (rightLineRef.current) {
        rightLineRef.current.style.left =
          `${imageInset + revealWidth}px`
      }

      if (bottomLineRef.current) {
        bottomLineRef.current.style.top =
          `${imageInset + revealHeight}px`
      }

      const transitionState =
        resolveImageTransition(
          switchProgressRef.current,
          images.length,
        )

      /**
       * 文字只在图片动画真正完成后更新。
       *
       * 不再依赖滚动方向：
       * - dither 到 1，说明新图已经完整显示；
       * - dither 回到 0，说明旧图已经完整恢复；
       * - 动画中间保持当前文字不变。
       *
       * 这样反向滚动即使 damping 已经停止，
       * 也不会因为 direction 变成 0 而漏掉文字更新。
       */
      let nextActiveIndex =
        activeIndexRef.current

      if (nextActiveIndex < 0) {
        nextActiveIndex =
          transitionState.ditherProgress >= 0.999
            ? transitionState.toIndex
            : transitionState.fromIndex
      } else if (
        transitionState.ditherProgress >= 0.999
      ) {
        nextActiveIndex =
          transitionState.toIndex
      } else if (
        transitionState.ditherProgress <= 0.001
      ) {
        nextActiveIndex =
          transitionState.fromIndex
      }

      if (
        nextActiveIndex !==
        activeIndexRef.current
      ) {
        activeIndexRef.current =
          nextActiveIndex

        onActiveIndexChangeRef.current?.(
          nextActiveIndex,
        )
      }

      animationFrame =
        window.requestAnimationFrame(
          animate,
        )
    }

    animationFrame =
      window.requestAnimationFrame(
        animate,
      )

    return () => {
      window.cancelAnimationFrame(
        animationFrame,
      )
    }
  }, [images.length])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas || images.length === 0) {
      return
    }

    const gl = canvas.getContext(
      "webgl",
      {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        powerPreference:
          "high-performance",
      },
    )

    if (!gl) {
      console.warn(
        "WebGL is not available. Showing the fallback image.",
      )

      return
    }

    let cancelled = false
    let animationFrame = 0

    let program: WebGLProgram | null = null
    let positionBuffer: WebGLBuffer | null =
      null

    let loadedTextures: LoadedTexture[] = []

    const initialize = async () => {
      try {
        program = createProgram(gl)

        positionBuffer =
          gl.createBuffer()

        if (!positionBuffer) {
          throw new Error(
            "Unable to create WebGL buffer.",
          )
        }

        gl.bindBuffer(
          gl.ARRAY_BUFFER,
          positionBuffer,
        )

        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,

            -1, 1,
            1, -1,
            1, 1,
          ]),
          gl.STATIC_DRAW,
        )

        loadedTextures =
          await Promise.all(
            images.map((image) =>
              loadTexture(
                gl,
                image.src,
              ),
            ),
          )

        if (cancelled || !program) {
          return
        }

        gl.useProgram(program)

        const positionLocation =
          gl.getAttribLocation(
            program,
            "aPosition",
          )

        gl.enableVertexAttribArray(
          positionLocation,
        )

        gl.vertexAttribPointer(
          positionLocation,
          2,
          gl.FLOAT,
          false,
          0,
          0,
        )

        const textureFromLocation =
          gl.getUniformLocation(
            program,
            "uTextureFrom",
          )

        const textureToLocation =
          gl.getUniformLocation(
            program,
            "uTextureTo",
          )

        const viewportSizeLocation =
          gl.getUniformLocation(
            program,
            "uViewportSize",
          )

        const textureFromSizeLocation =
          gl.getUniformLocation(
            program,
            "uTextureFromSize",
          )

        const textureToSizeLocation =
          gl.getUniformLocation(
            program,
            "uTextureToSize",
          )

        const progressLocation =
          gl.getUniformLocation(
            program,
            "uProgress",
          )

        const pixelRatioLocation =
          gl.getUniformLocation(
            program,
            "uPixelRatio",
          )

        gl.uniform1i(
          textureFromLocation,
          0,
        )

        gl.uniform1i(
          textureToLocation,
          1,
        )

        gl.clearColor(0, 0, 0, 1)

        setWebglReady(true)

        const render = () => {
          if (
            cancelled ||
            !program ||
            loadedTextures.length === 0
          ) {
            return
          }

          const pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            2,
          )

          const displayWidth = Math.max(
            Math.round(
              canvas.clientWidth *
                pixelRatio,
            ),
            1,
          )

          const displayHeight = Math.max(
            Math.round(
              canvas.clientHeight *
                pixelRatio,
            ),
            1,
          )

          if (
            canvas.width !== displayWidth ||
            canvas.height !== displayHeight
          ) {
            canvas.width = displayWidth
            canvas.height = displayHeight
          }

          gl.viewport(
            0,
            0,
            canvas.width,
            canvas.height,
          )

          gl.clear(
            gl.COLOR_BUFFER_BIT,
          )

          const transitionState =
            resolveImageTransition(
              switchProgressRef.current,
              loadedTextures.length,
            )

          const fromIndex =
            transitionState.fromIndex

          const toIndex =
            transitionState.toIndex

          const localProgress =
            transitionState.ditherProgress

          const fromTexture =
            loadedTextures[fromIndex]

          const toTexture =
            loadedTextures[toIndex]

          gl.activeTexture(gl.TEXTURE0)

          gl.bindTexture(
            gl.TEXTURE_2D,
            fromTexture.texture,
          )

          gl.activeTexture(gl.TEXTURE1)

          gl.bindTexture(
            gl.TEXTURE_2D,
            toTexture.texture,
          )

          gl.uniform2f(
            viewportSizeLocation,
            canvas.width,
            canvas.height,
          )

          gl.uniform2f(
            textureFromSizeLocation,
            fromTexture.width,
            fromTexture.height,
          )

          gl.uniform2f(
            textureToSizeLocation,
            toTexture.width,
            toTexture.height,
          )

          gl.uniform1f(
            progressLocation,
            localProgress,
          )

          gl.uniform1f(
            pixelRatioLocation,
            pixelRatio,
          )

          gl.drawArrays(
            gl.TRIANGLES,
            0,
            6,
          )

          animationFrame =
            window.requestAnimationFrame(
              render,
            )
        }

        animationFrame =
          window.requestAnimationFrame(
            render,
          )
      } catch (error) {
        console.error(
          "Unable to initialize product image WebGL transition:",
          error,
        )

        setWebglReady(false)
      }
    }

    void initialize()

    return () => {
      cancelled = true

      window.cancelAnimationFrame(
        animationFrame,
      )

      loadedTextures.forEach(
        ({ texture }) => {
          gl.deleteTexture(texture)
        },
      )

      if (positionBuffer) {
        gl.deleteBuffer(positionBuffer)
      }

      if (program) {
        gl.deleteProgram(program)
      }
    }
  }, [images])

  const firstImage = images[0]

  return (
    <div
      ref={rootRef}
      className="relative h-full min-h-0 w-full overflow-hidden"
      role="img"
      aria-label={
        firstImage?.alt ??
        "Product preview"
      }
    >
      <div
        className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-[#ff3f32]/20"
        style={{
          left: imageInset,
        }}
      />

      <div
        ref={rightLineRef}
        className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-[#ff3f32]/20"
        style={{
          left: imageInset,
        }}
      />

      <div
        className="pointer-events-none absolute left-0 right-0 z-20 h-px bg-[#ff3f32]/20"
        style={{
          top: imageInset,
        }}
      />

      <div
        ref={bottomLineRef}
        className="pointer-events-none absolute left-0 right-0 z-20 h-px bg-[#ff3f32]/20"
        style={{
          top: imageInset,
        }}
      />

      <div
        ref={clipRef}
        className="absolute z-10 overflow-hidden"
        style={{
          left: imageInset,
          top: imageInset,
          width: 0,
          height: 0,
          willChange:
            "width, height",
        }}
      >
        <div
          ref={scaleLayerRef}
          className="relative origin-top-left"
          style={{
            width: 0,
            height: 0,
            transform: `scale(${imageStartScale})`,
            willChange: "transform",
          }}
        >
          {firstImage ? (
            <img
              src={firstImage.src}
              alt={firstImage.alt}
              className={[
                "absolute inset-0 h-full w-full object-cover",
                "transition-opacity duration-300",
                webglReady
                  ? "opacity-0"
                  : "opacity-100",
              ].join(" ")}
            />
          ) : null}

          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className={[
              "absolute inset-0 h-full w-full",
              "transition-opacity duration-300",
              webglReady
                ? "opacity-100"
                : "opacity-0",
            ].join(" ")}
          />
        </div>
      </div>
    </div>
  )
}