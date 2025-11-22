import hljs from 'highlight.js/lib/core'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import React from 'react'

import { cn } from '@/lib/utils'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('css', css)

interface CodeBlockProps {
  children: React.ReactNode
  className?: string
}

function isBlockCode(className?: string | null) {
  if (!className) return false
  return /language-|lang-/.test(className)
}

function extractLanguage(className?: string | null) {
  if (!className) return null
  const match = className.match(/(?:language|lang)-([\w-]+)/)
  return match?.[1] ?? null
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  if (isBlockCode(className)) {
    const language = extractLanguage(className)
    const code = typeof children === 'string' ? children : React.Children.toArray(children).join('')
    const highlighted = code && (language ? hljs.highlight(code, { language }).value : hljs.highlightAuto(code).value)

    return (
      <pre>
        <code
          className={cn('hljs block', className, language ? `language-${language}` : undefined)}
          dangerouslySetInnerHTML={{ __html: highlighted || code }}
        />
      </pre>
    )
  }

  return <code className={cn(className)}>{children}</code>
}
