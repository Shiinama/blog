'use client'

import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import shell from 'highlight.js/lib/languages/shell'
import typescript from 'highlight.js/lib/languages/typescript'
import html from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import React, { useMemo, useState } from 'react'

import { cn } from '@/lib/utils'

const languages: Array<[string, typeof javascript]> = [
  ['javascript', javascript],
  ['typescript', typescript],
  ['css', css],
  ['bash', bash],
  ['shell', shell],
  ['json', json],
  ['markdown', markdown],
  ['html', html],
  ['xml', html],
  ['yaml', yaml]
]

languages.forEach(([name, language]) => hljs.registerLanguage(name, language))

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
  const highlighted = useMemo(() => {
    if (!code) return ''
    try {
      if (language && hljs.getLanguage(language)) {
        return hljs.highlight(code, { language }).value
      }
      return hljs.highlightAuto(code).value
    } catch (err) {
      console.error('Failed to highlight code, falling back to plain text', err)
      return escapeHtml(code)
    }
  }, [code, language])

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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
