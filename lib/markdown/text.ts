/** First paragraph of a Markdown document as plain-ish text, clipped for list/SEO summaries. */
export function extractSummary(markdown: string, maxLength = 160) {
  const firstParagraph = markdown
    .split(/\n{2,}/)
    .map((block) => block.replace(/[#>*`]/g, '').trim())
    .find(Boolean)

  const text = firstParagraph ?? markdown.replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}
