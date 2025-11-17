 
'use client'

import { useState } from 'react'

import { MarkdownRenderer } from '@/components/markdown/markdown-renderer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  name?: string
  placeholder?: string
}

export function MarkdownEditor({ value, onChange, name, placeholder }: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write')

  return (
    <Tabs value={tab} onValueChange={(next) => setTab(next as 'write' | 'preview')}>
      <TabsList>
        <TabsTrigger value="write">写作</TabsTrigger>
        <TabsTrigger value="preview">预览</TabsTrigger>
      </TabsList>
      <TabsContent value="write">
        <Textarea
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={24}
          placeholder={placeholder}
          className="font-mono"
          required
        />
      </TabsContent>
      <TabsContent value="preview">
        <div className="rounded-lg border bg-background p-4">
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-sm text-muted-foreground">开始输入内容以查看预览。</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
