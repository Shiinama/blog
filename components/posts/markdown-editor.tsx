'use client'

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import { createLowlight } from 'lowlight'
import MarkdownIt from 'markdown-it'
import { useEffect, useMemo, useRef } from 'react'
import TurndownService from 'turndown'

const lowlightInstance = createLowlight()
lowlightInstance.register({ javascript, typescript, css })

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  name?: string
  placeholder?: string
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const mdParser = useMemo(
    () =>
      new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true
      }),
    []
  )

  const turndownService = useMemo(() => new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' }), [])

  const htmlValue = useMemo(() => mdParser.render(value), [mdParser, value])
  const lastSyncRef = useRef(value)
  const editorScrollRef = useRef<HTMLDivElement | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Placeholder.configure({
        placeholder: placeholder ?? 'Write some Markdown...'
      }),
      Link.configure({
        openOnClick: false
      }),
      CodeBlockLowlight.configure({
        lowlight: lowlightInstance
      })
    ],
    editorProps: {
      attributes: {
        class: 'min-h-[420px] focus:outline-none'
      }
    },
    content: htmlValue,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const nextMarkdown = turndownService.turndown(html)
      if (nextMarkdown !== lastSyncRef.current) {
        lastSyncRef.current = nextMarkdown
        onChange(nextMarkdown)
      }
    }
  })

  useEffect(() => {
    if (!editor) {
      return
    }
    if (value === lastSyncRef.current) {
      return
    }

    editor.commands.setContent(htmlValue)
    lastSyncRef.current = value
  }, [editor, htmlValue, value])

  return (
    <div
      ref={editorScrollRef}
      className="prose dark:prose-invert max-w-none rounded-2xl border px-4 shadow-inner shadow-slate-900/5"
    >
      <EditorContent editor={editor} />
    </div>
  )
}
