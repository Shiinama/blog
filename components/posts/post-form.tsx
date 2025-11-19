'use client'

import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from 'react'

import { deletePostAction, savePostAction } from '@/actions/posts'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import useRouter from '@/hooks/use-router'
import { formatCategoryLabel } from '@/lib/categories'

import type { PostStatus } from '@/drizzle/schema'
import type { CategorySummary, PostDetails } from '@/lib/posts/types'

type EditablePost = PostDetails

interface PostFormProps {
  post?: EditablePost
  categories: CategorySummary[]
}

function formatDateValue(date?: Date | null) {
  if (!date) return ''
  const iso = new Date(date).toISOString()
  return iso.slice(0, 16)
}

export function PostForm({ post, categories }: PostFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('admin')
  const [content, setContent] = useState(post?.content ?? '')
  const [state, formAction] = useActionState(savePostAction, initialPostFormState)
  const [isDeleting, startDelete] = useTransition()
  const statusOptions = [
    { label: t('status.draft'), value: 'DRAFT' as PostStatus },
    { label: t('status.published'), value: 'PUBLISHED' as PostStatus }
  ]
  const [metadata, setMetadata] = useState(() => ({
    title: post?.title ?? '',
    slug: post?.slug ?? '',
    coverImageUrl: post?.coverImageUrl ?? '',
    tags: post?.tags?.join(', ') ?? '',
    categoryId: post?.categoryId ?? '',
    language: post?.language ?? 'zh',
    publishedAt: post?.publishedAt ? formatDateValue(post?.publishedAt) : '',
    summary: post?.summary ?? '',
    sortOrder: String(post?.sortOrder ?? 0),
    status: post?.status ?? 'DRAFT'
  }))
  const [isPublishModalOpen, setPublishModalOpen] = useState(false)

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

  const updateMetadataField = (key: keyof typeof metadata, value: string) => {
    setMetadata((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-8">
      <input type="hidden" name="postId" value={post?.id ?? ''} />
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="title" value={metadata.title} />
      <input type="hidden" name="slug" value={metadata.slug} />
      <input type="hidden" name="coverImageUrl" value={metadata.coverImageUrl} />
      <input type="hidden" name="tags" value={metadata.tags} />
      <input type="hidden" name="categoryId" value={metadata.categoryId} />
      <input type="hidden" name="language" value={metadata.language} />
      <input type="hidden" name="publishedAt" value={metadata.publishedAt} />
      <input type="hidden" name="summary" value={metadata.summary} />
      <input type="hidden" name="sortOrder" value={metadata.sortOrder} />
      <input type="hidden" name="status" value={metadata.status} />
      <div className="space-y-2">
        <MarkdownEditor
          name="content"
          value={content}
          onChange={setContent}
          placeholder={t('form.placeholders.content')}
        />
        {fieldError('content') && <p className="text-destructive text-sm">{fieldError('content')}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-4">
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
                  onChange={(event) => updateMetadataField('status', event.target.value)}
                  className="bg-background mt-2 w-full rounded-md border p-2"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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
    </form>
  )
}
