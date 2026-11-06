/** Blocks that aren't prose: headings, quotes, lists, tables, code, images, HTML, rules. */
const NON_PROSE = /^(?:#{1,6}\s|>|[-*+]\s|\d+[.)]\s|\||```|~~~|!\[|<|---|\*\*\*)/

/** Inline Markdown → plain text. */
const plain = (text: string) =>
  text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/** First prose paragraph of a Markdown document, as plain text clipped for list/SEO summaries. */
export function extractSummary(markdown: string, maxLength = 160) {
  const paragraph = markdown
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find((block) => block && !NON_PROSE.test(block))

  const text = plain(paragraph ?? markdown)
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}
