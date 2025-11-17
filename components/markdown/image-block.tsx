import Image from 'next/image'

interface ImageBlockProps {
  src?: string
  alt?: string
}

export function ImageBlock({ src, alt }: ImageBlockProps) {
  if (!src) return null

  return (
    <figure className="my-6 flex flex-col items-center">
      <Image src={src} alt={alt ?? ''} width={0} height={0} sizes="100vw" className="h-auto w-full rounded border" />
      {alt && <figcaption className="mt-2 text-sm text-muted-foreground">{alt}</figcaption>}
    </figure>
  )
}
