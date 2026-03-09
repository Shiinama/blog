import Markdown from 'markdown-to-jsx'

import { CodeBlock } from './code-block'
import { Heading } from './heading'
import { ImageBlock } from './image-block'
import { Paragraph } from './p-block'
import { VideoBlock } from './video-block'

interface MarkdownRendererProps {
  content: string
}

/**
 * 清理 markdown 内容中多余的星号
 * 修复 markdown-to-jsx 渲染时可能出现的多余 * 符号
 * 只处理明显是错误的情况，保留正常的 markdown 格式
 */
function cleanMarkdownAsterisks(content: string): string {
  // 按行处理，保留代码块和行内代码中的内容
  const lines = content.split('\n')
  const cleanedLines: string[] = []
  let inCodeBlock = false
  let codeBlockFence = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!

    // 检测代码块开始/结束
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

    // 代码块内的内容不处理
    if (inCodeBlock) {
      cleanedLines.push(line)
      continue
    }

    // 处理行内代码（不处理反引号内的内容）
    let cleanedLine = line
    const inlineCodeRegex = /`[^`]+`/g
    const codeMatches: Array<{ match: string; index: number }> = []
    let match: RegExpExecArray | null

    // 收集所有行内代码的位置
    while ((match = inlineCodeRegex.exec(line)) !== null) {
      codeMatches.push({ match: match[0]!, index: match.index! })
    }

    // 处理非代码部分的多余星号
    if (codeMatches.length === 0) {
      // 没有行内代码，直接处理整行
      cleanedLine = cleanAsterisksInText(line)
    } else {
      // 分段处理：代码块之间和代码块之外
      let result = ''
      let lastIndex = 0

      for (const { match: codeMatch, index } of codeMatches) {
        // 处理代码块之前的部分
        const beforeCode = line.slice(lastIndex, index)
        result += cleanAsterisksInText(beforeCode)
        // 保留代码块
        result += codeMatch
        lastIndex = index + codeMatch.length
      }
      // 处理最后一段
      const afterLastCode = line.slice(lastIndex)
      result += cleanAsterisksInText(afterLastCode)
      cleanedLine = result
    }

    cleanedLines.push(cleanedLine)
  }

  return cleanedLines.join('\n')
}

/**
 * 清理文本中多余的星号
 * 只移除明显是错误的情况，避免破坏正常的 markdown 格式
 */
function cleanAsterisksInText(text: string): string {
  const trimmed = text.trimStart()

  // Preserve valid Markdown structures that legitimately start with `*`.
  if (/^(?:\* |- |\+ |>\s|#{1,6}\s|\|)/.test(trimmed)) {
    return text
  }

  // Only drop isolated stray `*` tokens surrounded by whitespace.
  return text.replace(/(\s+)\*(\s+)/g, '$1$2')
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // 清理多余的星号后再渲染
  const cleanedContent = cleanMarkdownAsterisks(content)

  return (
    <Markdown
      className="prose dark:prose-invert max-w-none"
      options={{
        overrides: {
          p: { component: Paragraph },
          h1: { component: (props: any) => <Heading level={1} {...props} /> },
          h2: { component: (props: any) => <Heading level={2} {...props} /> },
          h3: { component: (props: any) => <Heading level={3} {...props} /> },
          h4: { component: (props: any) => <Heading level={4} {...props} /> },
          h5: { component: (props: any) => <Heading level={5} {...props} /> },
          h6: { component: (props: any) => <Heading level={6} {...props} /> },
          pre: { component: ({ children }: { children: React.ReactNode }) => <>{children}</> },
          code: { component: CodeBlock },
          img: { component: ImageBlock },
          CustomVideo: { component: VideoBlock }
        }
      }}
    >
      {cleanedContent}
    </Markdown>
  )
}
