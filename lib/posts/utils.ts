export function calculateReadingTime(content: string, wordsPerMinute = 220) {
  const words = content
    .replace(/[`*_#>~\-+=[\]{}()!]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length

  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

export function extractSummary(markdown: string, fallbackLength = 160) {
  const paragraphs = markdown
    .split(/\n{2,}/)
    .map((block) => block.replace(/[#>*`]/g, '').trim())
    .filter(Boolean)

  const firstParagraph = paragraphs[0]
  if (firstParagraph) {
    return firstParagraph.length > fallbackLength
      ? `${firstParagraph.slice(0, fallbackLength)}…`
      : firstParagraph
  }

  const fallback = markdown.replace(/\s+/g, ' ').trim()
  return fallback.length > fallbackLength ? `${fallback.slice(0, fallbackLength)}…` : fallback
}

export function normalizeSlug(slug: string) {
  if (!slug) return ''
  return slug
    .replace(/^\/+/, '')
    .replace(/^content\//, '')
    .replace(/^\/?content\//, '')
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/')
}
