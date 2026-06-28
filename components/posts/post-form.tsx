'use client'

import { ArrowLeft, Download, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState, useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from 'react'

import { deletePostAction, savePostAction, translatePostAction } from '@/actions/posts'
import { initialPostFormState } from '@/actions/posts/form-state'
import { MarkdownEditor } from '@/components/posts/markdown-editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import useRouter from '@/hooks/use-router'
import { formatCategoryLabel } from '@/lib/categories'
import { renderMarkdownToHtml } from '@/lib/markdown/pipeline'

import type { PostStatus } from '@/drizzle/schema'
import type { CategorySummary, PostDetails } from '@/lib/posts/types'

type EditablePost = PostDetails

type MetadataState = {
  title: string
  coverImageUrl: string
  tags: string
  categoryId: string
  language: string
  publishedAt: string
  summary: string
  sortOrder: string
  status: PostStatus
  isSubscriptionOnly: boolean
}

interface PostFormProps {
  post?: EditablePost
  categories: CategorySummary[]
  locale?: string
}

function formatDateValue(date?: Date | null) {
  if (!date) return ''
  const iso = new Date(date).toISOString()
  return iso.slice(0, 16)
}

export function PostForm({ post, categories, locale }: PostFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const formId = useId()
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('admin')
  const [content, setContent] = useState(post?.content ?? '')
  const [state, formAction] = useActionState(savePostAction, initialPostFormState)
  const [isDeleting, startDelete] = useTransition()
  const [isTranslating, startTranslate] = useTransition()
  const statusOptions = [
    { label: t('status.draft'), value: 'DRAFT' as PostStatus },
    { label: t('status.published'), value: 'PUBLISHED' as PostStatus }
  ]
  const [metadata, setMetadata] = useState<MetadataState>(() => ({
    title: post?.title ?? '',
    coverImageUrl: post?.coverImageUrl ?? '',
    tags: post?.tags?.join(', ') ?? '',
    categoryId: post?.categoryId ?? '',
    language: post?.language ?? 'zh',
    publishedAt: post?.publishedAt ? formatDateValue(post?.publishedAt) : '',
    summary: post?.summary ?? '',
    sortOrder: String(post?.sortOrder ?? 0),
    status: post?.status ?? 'DRAFT',
    isSubscriptionOnly: post?.isSubscriptionOnly ?? false
  }))
  const [isPublishModalOpen, setPublishModalOpen] = useState(false)
  const editorLocale = locale ?? post?.language ?? 'zh'
  const targetLocale = 'en'

  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: t('form.saveSuccessTitle'),
        description: t('form.saveSuccessDescription')
      })
      router.back()
    } else if (state.status === 'error') {
      toast({
        title: t('form.saveFailedTitle'),
        description: t('form.saveFailedDescription'),
        variant: 'destructive'
      })
    }
  }, [state.status, toast, t, router])

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: formatCategoryLabel(category.key) || category.key
      })),
    [categories]
  )

  const handleDelete = () => {
    if (!post) return
    if (!confirm(t('form.deleteConfirmation'))) {
      return
    }
    startDelete(async () => {
      const result = await deletePostAction(post.id)
      if (result.status === 'success') {
        toast({ title: t('form.deleteSuccess') })
        router.back()
      } else {
        toast({
          title: t('form.deleteFailed'),
          description: result.message ?? t('form.deleteFailedDescription'),
          variant: 'destructive'
        })
      }
    })
  }

  const fieldError = (field: string) => state.errors?.[field]?.join(', ')

  const exportDocument = useCallback(
    (format: 'md' | 'html' | 'txt' | 'json') => {
      const htmlContent = renderMarkdownToHtml(content)
      const baseName = metadata.title.trim() ? metadata.title.trim().replace(/\s+/g, '-') : 'post-content'
      let mimeType = 'text/plain;charset=utf-8'
      let fileName = `${baseName}.md`
      let fileContent = content

      if (format === 'html') {
        mimeType = 'text/html;charset=utf-8'
        fileName = `${baseName}.html`
        fileContent = htmlContent
      } else if (format === 'txt') {
        mimeType = 'text/plain;charset=utf-8'
        fileName = `${baseName}.txt`
        const plainText =
          typeof window === 'undefined'
            ? content
            : new DOMParser().parseFromString(htmlContent, 'text/html').body.textContent
        fileContent = plainText?.trim() || ''
      } else if (format === 'json') {
        mimeType = 'application/json;charset=utf-8'
        fileName = `${baseName}.json`
        fileContent = JSON.stringify(
          { format: 'markdown', exportedAt: new Date().toISOString(), content },
          null,
          2
        )
      }

      const blob = new Blob([fileContent], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      anchor.click()
      URL.revokeObjectURL(url)

      toast({ title: '导出成功', description: `已导出 ${fileName}` })
    },
    [content, metadata.title, toast]
  )

  const handlePublishConfirm = () => {
    setMetadata((prev) => ({ ...prev, status: 'PUBLISHED' }))
    setPublishModalOpen(false)
    formRef.current?.requestSubmit()
  }

  const handleSaveDraft = () => {
    setMetadata((prev) => ({ ...prev, status: 'DRAFT' }))
  }

  const updateMetadataField = <K extends keyof MetadataState>(key: K, value: MetadataState[K]) => {
    setMetadata((prev) => ({ ...prev, [key]: value }))
  }

  const handleTranslate = () => {
    if (!post?.id) {
      return
    }

    startTranslate(async () => {
      const result = await translatePostAction(post.id, targetLocale)

      if (result.status === 'success') {
        toast({
          title: t('form.translation.successTitle'),
          description: t('form.translation.successDescription', { locale: targetLocale })
        })
      } else {
        toast({
          title: t('form.translation.errorTitle'),
          description: result.message ?? t('form.translation.errorDescription'),
          variant: 'destructive'
        })
      }
    })
  }

  const isPublished = metadata.status === 'PUBLISHED'

  return (
    <form ref={formRef} id={formId} action={formAction} className="relative pb-16">
      <input type="hidden" name="postId" value={post?.id ?? ''} />
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="title" value={metadata.title} />
      <input type="hidden" name="coverImageUrl" value={metadata.coverImageUrl} />
      <input type="hidden" name="tags" value={metadata.tags} />
      <input type="hidden" name="categoryId" value={metadata.categoryId} />
      <input type="hidden" name="language" value={metadata.language} />
      <input type="hidden" name="editorLocale" value={editorLocale} />
      <input type="hidden" name="publishedAt" value={metadata.publishedAt} />
      <input type="hidden" name="summary" value={metadata.summary} />
      <input type="hidden" name="sortOrder" value={metadata.sortOrder} />
      <input type="hidden" name="status" value={metadata.status} />
      <input type="hidden" name="isSubscriptionOnly" value={metadata.isSubscriptionOnly ? 'true' : 'false'} />

      {/* Sticky action bar */}
      <div className="bg-background/80 supports-backdrop-filter:bg-background/60 sticky top-0 z-30 -mx-6 -mt-8 mb-6 border-b px-6 py-3 backdrop-blur lg:-mx-10 lg:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              aria-label={t('form.actions.cancel')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant={isPublished ? 'default' : 'secondary'}>
                {isPublished ? t('status.published') : t('status.draft')}
              </Badge>
              <span className="text-muted-foreground hidden text-sm sm:inline">{t('posts.new.title')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleTranslate}
                disabled={isTranslating}
              >
                {isTranslating ? t('form.translation.translating') : t('form.translation.translate')}
              </Button>
            )}
            {post && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {isDeleting ? t('form.actions.deleting') : t('form.actions.delete')}
                </span>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">导出</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportDocument('md')}>Markdown (.md)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportDocument('html')}>HTML (.html)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportDocument('txt')}>Plain Text (.txt)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportDocument('json')}>JSON (.json)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="submit"
              form={formId}
              variant="outline"
              size="sm"
              disabled={state.status === 'success'}
              onClick={handleSaveDraft}
            >
              {t('form.actions.saveDraft')}
            </Button>
            <Button type="button" size="sm" onClick={() => setPublishModalOpen(true)}>
              {t('form.actions.publish')}
            </Button>
          </div>
        </div>
      </div>

      {/* Writing surface */}
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-3">
          <input
            value={metadata.title}
            onChange={(event) => updateMetadataField('title', event.target.value)}
            placeholder={t('form.placeholders.title')}
            className="placeholder:text-muted-foreground/50 w-full border-0 bg-transparent text-3xl leading-tight font-semibold tracking-tight outline-none focus:ring-0 sm:text-4xl"
            aria-label={t('form.fields.title')}
          />
          {fieldError('title') && <p className="text-destructive text-sm">{fieldError('title')}</p>}
          <input
            value={metadata.summary}
            onChange={(event) => updateMetadataField('summary', event.target.value)}
            placeholder={t('form.placeholders.summary')}
            className="text-muted-foreground placeholder:text-muted-foreground/50 w-full border-0 bg-transparent text-lg outline-none focus:ring-0"
            aria-label={t('form.fields.summary')}
          />
        </div>
        <div className="space-y-2">
          <MarkdownEditor value={content} onChange={setContent} placeholder={t('form.placeholders.content')} />
          {fieldError('content') && <p className="text-destructive text-sm">{fieldError('content')}</p>}
        </div>
      </div>

      <Dialog open={isPublishModalOpen} onOpenChange={setPublishModalOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t('form.publishModal.title')}</DialogTitle>
            <DialogDescription>{t('form.publishModal.description')}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid gap-6">
              <div>
                <Label htmlFor="modal-category">{t('form.fields.category')}</Label>
                <select
                  id="modal-category"
                  value={metadata.categoryId}
                  onChange={(event) => updateMetadataField('categoryId', event.target.value)}
                  className="bg-background mt-2 w-full rounded-md border p-2"
                >
                  <option value="">{t('form.placeholders.category')}</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fieldError('categoryId') && <p className="text-destructive text-sm">{fieldError('categoryId')}</p>}
              </div>
              <div>
                <Label htmlFor="modal-sort">{t('form.fields.sortOrder')}</Label>
                <Input
                  id="modal-sort"
                  type="number"
                  value={metadata.sortOrder}
                  onChange={(event) => updateMetadataField('sortOrder', event.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="modal-status">{t('form.fields.status')}</Label>
                <select
                  id="modal-status"
                  value={metadata.status}
                  onChange={(event) => updateMetadataField('status', event.target.value as 'DRAFT' | 'PUBLISHED')}
                  className="bg-background mt-2 w-full rounded-md border p-2"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 shadow-inner shadow-slate-900/5">
                <div className="pr-3">
                  <Label htmlFor="modal-subscription" className="text-sm font-semibold">
                    {t('form.fields.subscriptionOnly')}
                  </Label>
                  <p className="text-muted-foreground mt-1 text-xs">{t('form.publishModal.subscriptionHint')}</p>
                </div>
                <Switch
                  id="modal-subscription"
                  checked={metadata.isSubscriptionOnly}
                  onCheckedChange={(checked) => updateMetadataField('isSubscriptionOnly', checked)}
                />
              </div>
              <div>
                <Label htmlFor="modal-cover">{t('form.fields.coverImageUrl')}</Label>
                <Input
                  id="modal-cover"
                  value={metadata.coverImageUrl}
                  onChange={(event) => updateMetadataField('coverImageUrl', event.target.value)}
                  placeholder={t('form.placeholders.coverImageUrl')}
                />
                {fieldError('coverImageUrl') && (
                  <p className="text-destructive text-sm">{fieldError('coverImageUrl')}</p>
                )}
              </div>
              <div>
                <Label htmlFor="modal-tags">{t('form.fields.tags')}</Label>
                <Input
                  id="modal-tags"
                  value={metadata.tags}
                  onChange={(event) => updateMetadataField('tags', event.target.value)}
                  placeholder="tag1, tag2"
                />
              </div>
              <div>
                <Label htmlFor="modal-language">{t('form.fields.language')}</Label>
                <Input
                  id="modal-language"
                  value={metadata.language}
                  onChange={(event) => updateMetadataField('language', event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="modal-published">{t('form.fields.publishedAt')}</Label>
                <Input
                  id="modal-published"
                  type="datetime-local"
                  value={metadata.publishedAt}
                  onChange={(event) => updateMetadataField('publishedAt', event.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6 flex justify-end gap-3">
            <DialogClose asChild>
              <Button variant="ghost">{t('form.actions.cancel')}</Button>
            </DialogClose>
            <Button onClick={handlePublishConfirm}>{t('form.actions.publish')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </form>
  )
}
