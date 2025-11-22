'use client'

import Code from '@tiptap/extension-code'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { TableKit } from '@tiptap/extension-table'
import { EditorContent, type Editor, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import { createLowlight } from 'lowlight'
import MarkdownIt from 'markdown-it'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TurndownService from 'turndown'

import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/use-toast'

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
  const editorRef = useRef<Editor | null>(null)
  const { toast } = useToast()
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const uploadImage = useCallback(async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/uploads', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })

    if (!response.ok) {
      let message = '上传图片失败'
      try {
        const data = await response.text()
        message = data
      } catch (error) {
        console.error('Failed to parse upload error', error)
      }
      throw new Error(message)
    }

    const data = (await response.json()) as { url?: string }
    if (!data.url) {
      throw new Error('未获取到上传后的图片地址')
    }

    return data.url
  }, [])

  const handleImagePaste = useCallback(
    async (files: File[]) => {
      if (!files.length || !editorRef.current) {
        return
      }
      try {
        setIsUploadingImage(true)
        for (const file of files) {
          const url = await uploadImage(file)
          editorRef.current.chain().focus().setImage({ src: url, alt: file.name }).run()
        }
      } catch (error) {
        console.error('Image upload failed', error)
        toast({
          title: '上传图片失败',
          description: error instanceof Error ? error.message : '请稍后再试',
          variant: 'destructive'
        })
      } finally {
        setIsUploadingImage(false)
      }
    },
    [toast, uploadImage]
  )

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
      TableKit.configure({
        table: { resizable: true }
      }),
      Highlight.configure({ multicolor: true }),
      CodeBlockLowlight.configure({
        lowlight: lowlightInstance
      }),
      Code
    ],
    editorProps: {
      attributes: {
        class: 'min-h-[420px] focus:outline-none'
      },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items || []).filter((item) => item.type.startsWith('image/'))
        if (!items.length) {
          return false
        }

        const files = items
          .map((item) => item.getAsFile())
          .filter(Boolean)
          .map((file) => file as File)

        if (!files.length) {
          return false
        }

        event.preventDefault()
        void handleImagePaste(files)
        return true
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
    editorRef.current = editor
    return () => {
      editorRef.current = null
    }
  }, [editor])

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
      className="prose dark:prose-invert relative max-w-none rounded-2xl border px-4 shadow-inner shadow-slate-900/5"
    >
      {isUploadingImage ? (
        <div className="bg-background/95 pointer-events-none absolute top-3 right-4 z-10 flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium shadow-sm ring-1 ring-slate-200/70">
          <Spinner className="h-3.5 w-3.5" />
          <span>图片上传中...</span>
        </div>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  )
}
