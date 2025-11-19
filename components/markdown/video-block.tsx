interface VideoBlockProps {
  src?: string
  title?: string
}

export function VideoBlock({ src, title }: VideoBlockProps) {
  if (!src) return null

  return (
    <figure>
      <video src={src} title={title} controls preload="metadata" />
      {title && <figcaption>{title}</figcaption>}
    </figure>
  )
}
