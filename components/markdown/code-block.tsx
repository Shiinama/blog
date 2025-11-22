'use client'

import hljs from 'highlight.js/lib/core'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import React, { useState } from 'react'

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
  const [copied, setCopied] = useState(false)

  const isBlock = isBlockCode(className)
  const language = isBlock ? extractLanguage(className) : null
  const code = isBlock ? getCodeString(children) : null
  const highlighted = code ? (language ? hljs.highlight(code, { language }).value : hljs.highlightAuto(code).value) : ''

  if (isBlock) {
    const handleCopy = async () => {
      if (!code) return
      try {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      } catch (err) {
        console.error('Failed to copy code', err)
      }
    }

    return (
      <div className="group relative">
        <button
          type="button"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground border-border bg-background/90 absolute top-3 right-3 rounded-md border px-2 py-1 text-[11px] font-medium tracking-[0.2em] uppercase transition-colors"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
        <pre className="overflow-x-auto pr-14">
          <code
            className={cn('hljs block', className, language ? `language-${language}` : undefined)}
            dangerouslySetInnerHTML={{ __html: highlighted ?? code }}
          />
        </pre>
      </div>
    )
  }

  return <code className={cn(className)}>{children}</code>
}

function getCodeString(children: React.ReactNode) {
  if (typeof children === 'string') return children
  return React.Children.toArray(children).join('')
}
