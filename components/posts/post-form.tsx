'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useFormState } from 'react-dom'

import { deletePostAction, savePostAction } from '@/actions/posts'
import { MarkdownEditor } from '@/components/posts/markdown-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AutoResizeTextarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from '@/i18n/navigation'
import { formatCategoryLabel } from '@/lib/categories'
import type { PostStatus } from '@/drizzle/schema'
import { useTranslations } from 'next-intl'

import type { CategorySummary, PostDetails } from '@/lib/posts/types'

import { initialPostFormState } from '@/actions/posts/form-state'

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
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('admin')
  const [content, setContent] = useState(post?.content ?? '')
  const [tagsValue, setTagsValue] = useState(post?.tags?.join(', ') ?? '')
  const [state, formAction] = useFormState(savePostAction, initialPostFormState)
  const [isDeleting, startDelete] = useTransition()
  const statusOptions = [
    { label: t('status.draft'), value: 'DRAFT' as PostStatus },
    { label: t('status.published'), value: 'PUBLISHED' as PostStatus }
  ]

  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: t('form.saveSuccessTitle'),
        description: t('form.saveSuccessDescription')
      })
      if (state.redirectTo) {
        router.replace(state.redirectTo)
      }
    } else if (state.status === 'error') {
      toast({
        title: t('form.saveFailedTitle'),
        description: state.message ?? t('form.saveFailedDescription'),
        variant: 'destructive'
      })
    }
  }, [state, router, toast, t])

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
        router.replace('/admin/posts')
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

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="postId" value={post?.id ?? ''} />
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="title">{t('form.fields.title')}</Label>
          <Input
            id="title"
            name="title"
            defaultValue={post?.title}
            placeholder={t('form.placeholders.title')}
            required
          />
          {fieldError('title') && <p className="text-sm text-destructive">{fieldError('title')}</p>}
        </div>
        <div>
          <Label htmlFor="slug">{t('form.fields.slug')}</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={post?.slug}
            placeholder={t('form.placeholders.slug')}
            required
          />
          {fieldError('slug') && <p className="text-sm text-destructive">{fieldError('slug')}</p>}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="categoryId">{t('form.fields.category')}</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={post?.categoryId}
            className="mt-2 w-full rounded-md border bg-background p-2"
            required
          >
            <option value="">{t('form.placeholders.category')}</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldError('categoryId') && <p className="text-sm text-destructive">{fieldError('categoryId')}</p>}
        </div>
        <div>
          <Label htmlFor="status">{t('form.fields.status')}</Label>
          <select
            id="status"
            name="status"
            defaultValue={post?.status ?? 'DRAFT'}
            className="mt-2 w-full rounded-md border bg-background p-2"
            required
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="coverImageUrl">{t('form.fields.coverImageUrl')}</Label>
          <Input
            id="coverImageUrl"
            name="coverImageUrl"
            defaultValue={post?.coverImageUrl ?? ''}
            placeholder={t('form.placeholders.coverImageUrl')}
          />
          {fieldError('coverImageUrl') && <p className="text-sm text-destructive">{fieldError('coverImageUrl')}</p>}
        </div>
        <div>
          <Label htmlFor="tags">{t('form.fields.tags')}</Label>
          <Input id="tags" name="tags" value={tagsValue} onChange={(event) => setTagsValue(event.target.value)} />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <Label htmlFor="sortOrder">{t('form.fields.sortOrder')}</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={post?.sortOrder ?? 0}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="language">{t('form.fields.language')}</Label>
          <Input id="language" name="language" defaultValue={post?.language ?? 'zh'} />
        </div>
        <div>
          <Label htmlFor="publishedAt">{t('form.fields.publishedAt')}</Label>
          <Input id="publishedAt" name="publishedAt" type="datetime-local" defaultValue={formatDateValue(post?.publishedAt)} />
        </div>
      </div>
      <div>
        <Label htmlFor="summary">{t('form.fields.summary')}</Label>
        <AutoResizeTextarea
          id="summary"
          name="summary"
          defaultValue={post?.summary ?? ''}
          placeholder={t('form.placeholders.summary')}
          minRows={4}
          maxRows={8}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('form.fields.content')}</Label>
        <MarkdownEditor
          name="content"
          value={content}
          onChange={setContent}
          placeholder={t('form.placeholders.content')}
        />
        {fieldError('content') && <p className="text-sm text-destructive">{fieldError('content')}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={state.status === 'success'}>
          {t('form.actions.save')}
        </Button>
        {post && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? t('form.actions.deleting') : t('form.actions.delete')}
          </Button>
        )}
      </div>
    </form>
  )
}
