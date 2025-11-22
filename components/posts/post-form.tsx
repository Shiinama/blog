'use client'

import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useId, useMemo, useRef, useState, useTransition } from 'react'

import { deletePostAction, savePostAction, translatePostAction } from '@/actions/posts'
import { initialPostFormState } from '@/actions/posts/form-state'
import { MarkdownEditor } from '@/components/posts/markdown-editor'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import useRouter from '@/hooks/use-router'
import { locales } from '@/i18n/routing'
import { formatCategoryLabel } from '@/lib/categories'

import type { PostStatus } from '@/drizzle/schema'
import type { CategorySummary, PostDetails } from '@/lib/posts/types'

type EditablePost = PostDetails

type MetadataState = {
  title: string
  slug: string
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
    slug: post?.slug ?? '',
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
  const [targetLocale, setTargetLocale] = useState(() => {
    const source = post?.language ?? 'zh'
    return locales.find((locale) => locale.code !== source)?.code ?? locales[0]?.code ?? 'en'
  })

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
    if (!post?.id || !targetLocale) {
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

  return (
    <form ref={formRef} id={formId} action={formAction} className="relative space-y-8">
      <input type="hidden" name="postId" value={post?.id ?? ''} />
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="title" value={metadata.title} />
      <input type="hidden" name="slug" value={metadata.slug} />
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
      <div className="pointer-events-none fixed top-24 right-4 z-40 hidden max-w-xs flex-col gap-3 md:flex lg:right-10">
        <div className="bg-background/90 pointer-events-auto rounded-2xl border border-slate-200 px-4 py-3 shadow-xl shadow-slate-900/10 backdrop-blur">
          <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-[0.22em] uppercase">
            {t('form.sticky.title')}
          </p>
          <div className="flex flex-col gap-2">
            <Button type="submit" form={formId} disabled={state.status === 'success'} onClick={handleSaveDraft}>
              {t('form.actions.saveDraft')}
            </Button>
            <Button type="button" onClick={() => setPublishModalOpen(true)}>
              {t('form.actions.publish')}
            </Button>
            {post && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? t('form.actions.deleting') : t('form.actions.delete')}
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <MarkdownEditor
          name="content"
          value={content}
          onChange={setContent}
          placeholder={t('form.placeholders.content')}
        />
        {fieldError('content') && <p className="text-destructive text-sm">{fieldError('content')}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-4 md:hidden">
        <Button type="submit" disabled={state.status === 'success'} onClick={handleSaveDraft}>
          {t('form.actions.saveDraft')}
        </Button>
        <Button type="button" onClick={() => setPublishModalOpen(true)}>
          {t('form.actions.publish')}
        </Button>
        {post && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? t('form.actions.deleting') : t('form.actions.delete')}
          </Button>
        )}
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
                <Label htmlFor="modal-title">{t('form.fields.title')}</Label>
                <Input
                  id="modal-title"
                  onChange={(event) => updateMetadataField('title', event.target.value)}
                  value={metadata.title}
                  placeholder={t('form.placeholders.title')}
                  required
                />
                {fieldError('title') && <p className="text-destructive text-sm">{fieldError('title')}</p>}
              </div>
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
                <Label htmlFor="modal-slug">{t('form.fields.slug')}</Label>
                <Input
                  id="modal-slug"
                  value={metadata.slug}
                  onChange={(event) => updateMetadataField('slug', event.target.value)}
                  placeholder={t('form.placeholders.slug')}
                />
                {fieldError('slug') && <p className="text-destructive text-sm">{fieldError('slug')}</p>}
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
              <div>
                <Label htmlFor="modal-summary">{t('form.fields.summary')}</Label>
                <Textarea
                  id="modal-summary"
                  value={metadata.summary}
                  onChange={(event) => {
                    updateMetadataField('summary', event.target.value)
                  }}
                  rows={4}
                  placeholder={t('form.placeholders.summary')}
                />
                <p className="text-muted-foreground text-xs">{t('form.publishModal.help')}</p>
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

      <div className="bg-muted/40 rounded-2xl border border-slate-200 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.3em] uppercase">
              {t('form.translation.title')}
            </p>
            <p className="text-muted-foreground text-sm">{t('form.translation.description')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-muted-foreground text-sm font-medium" htmlFor="translation-target">
              {t('form.translation.targetLabel')}
            </label>
            <select
              id="translation-target"
              value={targetLocale}
              onChange={(event) => setTargetLocale(event.target.value)}
              className="bg-background rounded-md border px-3 py-2 text-sm"
            >
              {locales.map((locale) => (
                <option key={locale.code} value={locale.code}>
                  {locale.name}
                </option>
              ))}
            </select>
            <Button type="button" onClick={handleTranslate} disabled={!post?.id || isTranslating}>
              {isTranslating ? t('form.translation.translating') : t('form.translation.translate')}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
