import Markdown from 'markdown-to-jsx'

import { CodeBlock } from './code-block'
import { Heading } from './heading'
import { ImageBlock } from './image-block'
import { Paragraph } from './p-block'
import { VideoBlock } from './video-block'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
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
      {content}
    </Markdown>
  )
}
