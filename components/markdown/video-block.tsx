interface VideoBlockProps {
  src?: string
  title?: string
}

export function VideoBlock({ src, title }: VideoBlockProps) {
  if (!src) return null

  return (
    <figure className="my-6 flex flex-col items-center">
      <video src={src} title={title} controls preload="metadata" className="h-auto w-full rounded border" />
      {title && <figcaption className="mt-2 text-sm text-muted-foreground">{title}</figcaption>}
    </figure>
  )
}
