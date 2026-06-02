import { useEffect, useRef } from "react"

type WebGLBlurImageProps = {
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

    // cover
    if (uObjectFitMode < 0.5) {
      if (canvasAspect > imageAspect) {
        scale.y = imageAspect / canvasAspect;
      } else {
        scale.x = canvasAspect / imageAspect;
      }

      return (uv - 0.5) * scale + 0.5;
    }

    // contain
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

  vec2 getPixelImageUv(vec2 uv) {
    return getImageUv(getPixelCanvasUv(uv));
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

    // 毛玻璃发白
    frostedColor.rgb = mix(
      frostedColor.rgb,
      vec3(1.0),
      uGlassStrength
    );

    // 降低对比度，变成雾面质感
    frostedColor.rgb = mix(
      vec3(0.5),
      frostedColor.rgb,
      0.82
    );

    // 基于像素块的固定噪点
    float blockNoise = random(floor(vUv * uCanvasSize / uPixelSize));

    // 更细的颗粒噪点
    float grainNoise = random(vUv * uNoiseScale + blockNoise);

    float noise = mix(blockNoise, grainNoise, 0.45);
    noise = noise * 2.0 - 1.0;

    frostedColor.rgb += noise * uNoiseStrength;

    // 给噪点加一点亮暗分离，让大面积白色也能看出颗粒
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

    vec4 finalColor = mix(frostedColor, sharpColor, reveal);

    gl_FragColor = finalColor;
  }
`

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
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
    fragmentShaderSource,
  )

  const program = gl.createProgram()

  if (!program) {
    throw new Error("Failed to create WebGL program")
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(message ?? "Program link failed")
  }

  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  return program
}

export default function WebGLBlurImage({
  src,
  alt = "",
  className = "",
  pixelSize = 18,
  blurStrength = 3.5,
  revealRadius = 0.16,
  revealSoftness = 0.18,
  glassStrength = 0.28,
  noiseStrength = 0.055,
  noiseScale = 420,
  objectFit = "cover",
}: WebGLBlurImageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const mouseRef = useRef({
    x: 0.5,
    y: 0.5,
  })

  const hoverRef = useRef(0)
  const targetHoverRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) return

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    })

    if (!gl) return

    const program = createProgram(gl)

    const positionLocation = gl.getAttribLocation(program, "aPosition")
    const uvLocation = gl.getAttribLocation(program, "aUv")

    const textureLocation = gl.getUniformLocation(program, "uTexture")
    const canvasSizeLocation = gl.getUniformLocation(program, "uCanvasSize")
    const imageSizeLocation = gl.getUniformLocation(program, "uImageSize")
    const mouseLocation = gl.getUniformLocation(program, "uMouse")
    const hoverLocation = gl.getUniformLocation(program, "uHover")
    const pixelSizeLocation = gl.getUniformLocation(program, "uPixelSize")
    const blurStrengthLocation = gl.getUniformLocation(program, "uBlurStrength")
    const revealRadiusLocation = gl.getUniformLocation(program, "uRevealRadius")
    const revealSoftnessLocation = gl.getUniformLocation(
      program,
      "uRevealSoftness",
    )
    const glassStrengthLocation = gl.getUniformLocation(program, "uGlassStrength")
    const noiseStrengthLocation = gl.getUniformLocation(program, "uNoiseStrength")
    const noiseScaleLocation = gl.getUniformLocation(program, "uNoiseScale")
    const objectFitModeLocation = gl.getUniformLocation(
      program,
      "uObjectFitMode",
    )

    const buffer = gl.createBuffer()

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

    const vertices = new Float32Array([
      -1, -1, 0, 0,
      1, -1, 1, 0,
      -1, 1, 0, 1,

      -1, 1, 0, 1,
      1, -1, 1, 0,
      1, 1, 1, 1,
    ])

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const texture = gl.createTexture()

    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    let imageWidth = 1
    let imageHeight = 1
    let imageLoaded = false
    let destroyed = false

    const image = new Image()
    image.crossOrigin = "anonymous"

    image.onload = () => {
      if (destroyed) return

      imageWidth = image.naturalWidth
      imageHeight = image.naturalHeight
      imageLoaded = true

      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      )
    }

    image.src = src

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      const width = Math.max(1, Math.floor(rect.width * dpr))
      const height = Math.max(1, Math.floor(rect.height * dpr))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
      }
    }

    const render = () => {
      if (destroyed) return

      resize()

      hoverRef.current += (targetHoverRef.current - hoverRef.current) * 0.09

      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      if (imageLoaded) {
        gl.useProgram(program)

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

        gl.enableVertexAttribArray(positionLocation)
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0)

        gl.enableVertexAttribArray(uvLocation)
        gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 16, 8)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)

        gl.uniform1i(textureLocation, 0)

        gl.uniform2f(canvasSizeLocation, canvas.width, canvas.height)
        gl.uniform2f(imageSizeLocation, imageWidth, imageHeight)
        gl.uniform2f(mouseLocation, mouseRef.current.x, mouseRef.current.y)

        gl.uniform1f(hoverLocation, hoverRef.current)
        gl.uniform1f(pixelSizeLocation, pixelSize)
        gl.uniform1f(blurStrengthLocation, blurStrength)
        gl.uniform1f(revealRadiusLocation, revealRadius)
        gl.uniform1f(revealSoftnessLocation, revealSoftness)
        gl.uniform1f(glassStrengthLocation, glassStrength)
        gl.uniform1f(noiseStrengthLocation, noiseStrength)
        gl.uniform1f(noiseScaleLocation, noiseScale)
        gl.uniform1f(objectFitModeLocation, objectFit === "cover" ? 0 : 1)

        gl.drawArrays(gl.TRIANGLES, 0, 6)
      }

      rafRef.current = requestAnimationFrame(render)
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()

      mouseRef.current = {
        x: (event.clientX - rect.left) / rect.width,
        y: 1 - (event.clientY - rect.top) / rect.height,
      }
    }

    const handlePointerEnter = () => {
      targetHoverRef.current = 1
    }

    const handlePointerLeave = () => {
      targetHoverRef.current = 0
    }

    canvas.addEventListener("pointermove", handlePointerMove)
    canvas.addEventListener("pointerenter", handlePointerEnter)
    canvas.addEventListener("pointerleave", handlePointerLeave)
    window.addEventListener("resize", resize)

    render()

    return () => {
      destroyed = true

      canvas.removeEventListener("pointermove", handlePointerMove)
      canvas.removeEventListener("pointerenter", handlePointerEnter)
      canvas.removeEventListener("pointerleave", handlePointerLeave)
      window.removeEventListener("resize", resize)

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }

      gl.deleteTexture(texture)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    }
  }, [
    src,
    pixelSize,
    blurStrength,
    revealRadius,
    revealSoftness,
    glassStrength,
    noiseStrength,
    noiseScale,
    objectFit,
  ])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      className={`block h-full w-full ${className}`}
    />
  )
}