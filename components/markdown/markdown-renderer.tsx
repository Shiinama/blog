import React from 'react'
import ReactMarkdown from 'react-markdown'

import { markdownRehypePlugins, markdownRemarkPlugins, normalizeMarkdown } from '@/lib/markdown/pipeline'

import { CodeBlock } from './code-block'
import { Heading } from './heading'
import { ImageBlock } from './image-block'
import { Paragraph } from './p-block'
import { VideoBlock } from './video-block'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const cleanedContent = normalizeMarkdown(content)
  const components: Record<string, any> = {
    p: ({ children }: { children: React.ReactNode }) => <Paragraph>{children}</Paragraph>,
    h1: ({ children }: { children: React.ReactNode }) => <Heading level={1}>{children}</Heading>,
    h2: ({ children }: { children: React.ReactNode }) => <Heading level={2}>{children}</Heading>,
    h3: ({ children }: { children: React.ReactNode }) => <Heading level={3}>{children}</Heading>,
    h4: ({ children }: { children: React.ReactNode }) => <Heading level={4}>{children}</Heading>,
    h5: ({ children }: { children: React.ReactNode }) => <Heading level={5}>{children}</Heading>,
    h6: ({ children }: { children: React.ReactNode }) => <Heading level={6}>{children}</Heading>,
    pre: ({ children }: { children: React.ReactNode }) => {
      if (React.isValidElement(children)) {
        const child = children as React.ReactElement<{ className?: string }>
        return React.cloneElement(child, {
          className: child.props.className || 'language-plaintext'
        })
      }

      return <>{children}</>
    },
    code: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <CodeBlock className={className}>{children}</CodeBlock>
    ),
    img: ({ src, alt }: { src?: string | Blob; alt?: string }) => (
      <ImageBlock src={typeof src === 'string' ? src : undefined} alt={alt} />
    ),
    customvideo: ({ src, title }: { src?: unknown; title?: unknown }) => (
      <VideoBlock src={typeof src === 'string' ? src : undefined} title={typeof title === 'string' ? title : undefined} />
    ),
    CustomVideo: ({ src, title }: { src?: unknown; title?: unknown }) => (
      <VideoBlock src={typeof src === 'string' ? src : undefined} title={typeof title === 'string' ? title : undefined} />
    )
  }

  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={markdownRemarkPlugins} rehypePlugins={markdownRehypePlugins} components={components}>
        {cleanedContent}
      </ReactMarkdown>
    </div>
  )
}
