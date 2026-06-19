const loadedImages = new Map<string, HTMLImageElement>()
const pendingImages = new Map<string, Promise<HTMLImageElement>>()

export function getCachedImage(src: string) {
  return loadedImages.get(src)
}

export function preloadImage(src: string) {
  const loadedImage = loadedImages.get(src)

  if (loadedImage) {
    return Promise.resolve(loadedImage)
  }

  const pendingImage = pendingImages.get(src)

  if (pendingImage) {
    return pendingImage
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()

    image.decoding = "async"
    image.loading = "eager"

    image.onload = () => {
      const settle = () => {
        loadedImages.set(src, image)
        pendingImages.delete(src)
        resolve(image)
      }

      if (!image.decode) {
        settle()
        return
      }

      image.decode().then(settle).catch(settle)
    }

    image.onerror = () => {
      pendingImages.delete(src)
      reject(new Error(`Failed to load ${src}`))
    }

    image.src = src
  })

  pendingImages.set(src, promise)
  return promise
}
