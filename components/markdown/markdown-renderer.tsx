import Image from 'next/image'
import Markdown, { type Components } from 'react-markdown'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

import { CodeBlock } from './code-block'

const components: Components = {
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  img: ({ src, alt }) =>
    typeof src === 'string' ? (
      <Image
        src={src}
        alt={alt ?? ''}
        width={1200}
        height={675}
        sizes="(max-width: 768px) 100vw, 768px"
        className="h-auto w-full rounded-lg"
      />
    ) : null,
  a: ({ href, children, ...props }) => {
    const external = href?.startsWith('http')
    return (
      <a href={href} {...props} {...(external && { target: '_blank', rel: 'noopener noreferrer' })}>
        {children}
      </a>
    )
  }
}

/**
 * Server-rendered Markdown (GFM). Syntax highlighting and heading anchors happen here,
 * so readers download no Markdown or highlighting code.
 */
export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose dark:prose-invert prose-headings:scroll-mt-20 max-w-none">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
          [rehypeHighlight, { detect: true }]
        ]}
        components={components}
      >
        {content}
      </Markdown>
    </div>
  )
}
