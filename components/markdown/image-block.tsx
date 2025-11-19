import Image from 'next/image'

interface ImageBlockProps {
  src?: string
  alt?: string
}

export function ImageBlock({ src, alt }: ImageBlockProps) {
  if (!src) return null

  return (
    <figure>
      <Image src={src} alt={alt ?? ''} width={0} height={0} sizes="100vw" className="h-auto w-full rounded border" />
    </figure>
  )
}
