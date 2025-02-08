import { ImageLoaderProps } from 'next/image'

// Docs: https://imagekit.io/docs/image-transformation
export default function imageKitLoader({ src }: ImageLoaderProps) {
  // const params = [`w-${width}`, `q-${quality || 80}`]
  return `https://ik.imagekit.io/ixou4q6nu${src}`
}
