'use client'

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { TableKit } from '@tiptap/extension-table'
import { Markdown } from '@tiptap/markdown'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { common, createLowlight } from 'lowlight'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import { Spinner } from '@/components/ui/spinner'

const lowlight = createLowlight(common)

type Props = {
  /** Initial Markdown. The editor is uncontrolled; remount it (via `key`) to load other content. */
  defaultValue: string
  onChange: (markdown: string) => void
  placeholder?: string
}

async function uploadImage(file: File) {
  const body = new FormData()
  body.append('file', file)
  const response = await fetch('/api/uploads', { method: 'POST', body })
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string }
  if (!response.ok || !data.url) throw new Error(data.error ?? response.statusText)
  return data.url
}

export function MarkdownEditor({ defaultValue, onChange, placeholder }: Props) {
  const t = useTranslations('admin.editor')
  const [uploading, setUploading] = useState(false)

  const insertImages = async (editor: Editor, files: File[]) => {
    setUploading(true)
    try {
      for (const file of files) {
        editor
          .chain()
          .focus()
          .setImage({ src: await uploadImage(file), alt: file.name })
          .run()
      }
    } catch (error) {
      toast.error(t('uploadFailed'), { description: error instanceof Error ? error.message : undefined })
    } finally {
      setUploading(false)
    }
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false, link: { openOnClick: false } }),
      CodeBlockLowlight.configure({ lowlight }),
      Image,
      TableKit,
      Highlight,
      Placeholder.configure({ placeholder }),
      Markdown
    ],
    content: defaultValue,
    contentType: 'markdown',
    editorProps: {
      attributes: { class: 'min-h-[420px] focus:outline-none' },
      handlePaste: (_view, event) => {
        const files = [...(event.clipboardData?.files ?? [])].filter((file) => file.type.startsWith('image/'))
        if (files.length && editor) {
          event.preventDefault()
          void insertImages(editor, files)
          return true
        }
        // Plain text is usually Markdown when writing a post.
        const text = event.clipboardData?.getData('text/plain')
        if (text && !event.clipboardData?.types.includes('text/html') && editor) {
          event.preventDefault()
          editor.commands.insertContent(text, { contentType: 'markdown' })
          return true
        }
        return false
      }
    },
    onUpdate: ({ editor }) => onChange(editor.getMarkdown())
  })

  return (
    <div className="relative">
      {uploading && (
        <div className="bg-background/95 text-muted-foreground absolute top-0 right-0 z-10 flex items-center gap-2 rounded-full px-3 py-1 text-xs shadow-sm ring-1">
          <Spinner className="size-3.5" />
          {t('uploading')}
        </div>
      )}
      <div className="prose dark:prose-invert min-h-[55vh] max-w-none border-t pt-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
