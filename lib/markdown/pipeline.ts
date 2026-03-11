import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

export const markdownRemarkPlugins = [remarkGfm, remarkMath]
export const markdownRehypePlugins = [rehypeRaw]

const htmlProcessor = unified()
  .use(remarkParse)
  .use(markdownRemarkPlugins[0])
  .use(markdownRemarkPlugins[1])
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify, { allowDangerousHtml: true })

export function renderMarkdownToHtml(content: string) {
  return String(htmlProcessor.processSync(normalizeMarkdown(content)))
}

/**
 * Normalize known malformed content while preserving valid Markdown structures.
 */
export function normalizeMarkdown(content: string): string {
  const lines = content.split('\n')
  const cleanedLines: string[] = []
  let inCodeBlock = false
  let codeBlockFence = ''

  for (const line of lines) {
    const codeBlockMatch = line.match(/^(\s*)(```|~~~)/)
    if (codeBlockMatch) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeBlockFence = codeBlockMatch[2]!
      } else if (codeBlockMatch[2] === codeBlockFence) {
        inCodeBlock = false
        codeBlockFence = ''
      }
      cleanedLines.push(line)
      continue
    }

    if (inCodeBlock) {
      cleanedLines.push(line)
      continue
    }

    let cleanedLine = line
    const inlineCodeRegex = /`[^`]+`/g
    const codeMatches: Array<{ match: string; index: number }> = []
    let match: RegExpExecArray | null

    while ((match = inlineCodeRegex.exec(line)) !== null) {
      codeMatches.push({ match: match[0]!, index: match.index! })
    }

    if (codeMatches.length === 0) {
      cleanedLine = cleanAsterisksInText(line)
    } else {
      let result = ''
      let lastIndex = 0

      for (const { match: codeMatch, index } of codeMatches) {
        result += cleanAsterisksInText(line.slice(lastIndex, index))
        result += codeMatch
        lastIndex = index + codeMatch.length
      }

      result += cleanAsterisksInText(line.slice(lastIndex))
      cleanedLine = result
    }

    cleanedLines.push(cleanedLine)
  }

  return cleanedLines.join('\n')
}

function cleanAsterisksInText(text: string): string {
  const trimmed = text.trimStart()

  if (/^(?:\* |- |\+ |>\s|#{1,6}\s|\|)/.test(trimmed)) {
    return text
  }

  return text.replace(/(\s+)\*(\s+)/g, '$1$2')
}
