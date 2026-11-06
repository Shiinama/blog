'use client'

import { ArrowLeft, Download, Languages, Loader2, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useActionState, useId, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deletePost, savePost, translatePost } from '@/actions/posts'
import { MarkdownEditor } from '@/components/posts/markdown-editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Link } from '@/i18n/navigation'
import { localeNames, routing, type Locale } from '@/i18n/routing'

import type { EditablePost } from '@/lib/data/posts'

type Category = { id: string; key: string; label: string }

type Props = {
  post: EditablePost | null
  categories: Category[]
  /** Locale being edited. Equals `post.locale` for the original. */
  locale: Locale
}

/** `datetime-local` works in local time; the server gets an ISO string. */
const toLocalInput = (date: Date | null | undefined) => {
  if (!date) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

export function PostForm({ post, categories, locale }: Props) {
  const t = useTranslations('admin.editor')
  const tErrors = useTranslations('actions.errors')
  const uiLocale = useLocale()
  const formId = useId()
  const [state, formAction, isSaving] = useActionState<Awaited<ReturnType<typeof savePost>>, FormData>(
    async (previous, formData) => {
      const result = await savePost(previous, formData)
      if (result?.ok) toast.success(t('saved'))
      else if (result) toast.error(tErrors(result.error))
      return result
    },
    null
  )
  const [isTranslating, startTranslate] = useTransition()
  const [isDeleting, startDelete] = useTransition()

  const isOriginal = !post || post.locale === locale
  const translation = post?.translations.find((item) => item.locale === locale)
  const source = isOriginal ? post : translation
  const [content, setContent] = useState(source?.content ?? '')
  const [publishedAt, setPublishedAt] = useState(toLocalInput(post?.publishedAt))

  // React resets the form after every action; after a failure, restore what was submitted.
  const previous = state?.ok === false ? state.values : undefined
  const fieldError = (field: string) => {
    const key = state?.ok === false ? state.fieldErrors?.[field] : undefined
    return key ? tErrors(key) : undefined
  }

  const isPublished = post?.status === 'PUBLISHED'
  const title = source?.title ?? ''

  const downloadMarkdown = () => {
    const anchor = document.createElement('a')
    anchor.href = URL.createObjectURL(new Blob([content], { type: 'text/markdown' }))
    anchor.download = `${(title || 'post').trim().replace(/\s+/g, '-')}.md`
    anchor.click()
    URL.revokeObjectURL(anchor.href)
  }

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="bg-background/80 sticky top-14 z-30 -mx-6 border-b px-6 py-3 backdrop-blur lg:-mx-10 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" aria-label={t('back')}>
              <Link href="/admin/posts">
                <ArrowLeft />
              </Link>
            </Button>
            <Badge variant={isPublished ? 'default' : 'secondary'}>
              {isPublished ? t('status.published') : t('status.draft')}
            </Badge>
            {post && (
              <nav className="ml-2 flex gap-1" aria-label={t('locales')}>
                {routing.locales.map((item) => {
                  const exists = item === post.locale || post.translations.some((tr) => tr.locale === item)
                  return (
                    <Button key={item} asChild size="sm" variant={item === locale ? 'secondary' : 'ghost'}>
                      <Link href={{ pathname: `/admin/posts/${post.id}`, query: { locale: item } }}>
                        {localeNames[item]}
                        {item === post.locale ? ' ★' : !exists ? ' +' : ''}
                      </Link>
                    </Button>
                  )
                })}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-2">
            {post && !isOriginal && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isTranslating}
                onClick={() =>
                  startTranslate(async () => {
                    if (translation && !confirm(t('translateOverwrite'))) return
                    const result = await translatePost(post.id, locale)
                    if (result?.ok) toast.success(t('translated'))
                    else if (result) toast.error(tErrors(result.error))
                  })
                }
              >
                {isTranslating ? <Loader2 className="animate-spin" /> : <Languages />}
                {t('translate')}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('export')}
              title={t('export')}
              onClick={downloadMarkdown}
            >
              <Download />
            </Button>
            {post && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('delete')}
                className="text-destructive hover:text-destructive"
                disabled={isDeleting}
                onClick={() => confirm(t('deleteConfirm')) && startDelete(() => deletePost(post.id, uiLocale))}
              >
                <Trash2 />
              </Button>
            )}
            <Button
              type="submit"
              form={formId}
              name="status"
              value="DRAFT"
              variant="outline"
              size="sm"
              disabled={isSaving}
            >
              {isPublished ? t('unpublish') : t('saveDraft')}
            </Button>
            <Button type="submit" form={formId} name="status" value="PUBLISHED" size="sm" disabled={isSaving}>
              {isSaving && <Loader2 className="animate-spin" />}
              {isPublished ? t('update') : t('publish')}
            </Button>
          </div>
        </div>
      </div>

      {/* Remount when switching locale or after a machine translation lands. */}
      <form
        key={`${locale}:${source?.updatedAt?.getTime() ?? 'new'}`}
        id={formId}
        action={formAction}
        className="grid gap-8 lg:grid-cols-[1fr_18rem]"
      >
        {post && <input type="hidden" name="id" value={post.id} />}
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="uiLocale" value={uiLocale} />
        <input type="hidden" name="content" value={content} />
        <input type="hidden" name="publishedAt" value={publishedAt ? new Date(publishedAt).toISOString() : ''} />

        <div className="min-w-0 space-y-4">
          {!isOriginal && !translation && <p className="bg-muted/50 rounded-xl p-3 text-sm">{t('noTranslation')}</p>}
          <input
            name="title"
            defaultValue={previous?.title ?? title}
            required
            placeholder={t('titlePlaceholder')}
            aria-label={t('title')}
            className="placeholder:text-muted-foreground/50 w-full bg-transparent text-3xl font-semibold tracking-tight outline-none sm:text-4xl"
          />
          {fieldError('title') && <p className="text-destructive text-sm">{fieldError('title')}</p>}
          <Textarea
            name="summary"
            defaultValue={previous?.summary ?? source?.summary ?? ''}
            rows={2}
            placeholder={t('summaryPlaceholder')}
            aria-label={t('summary')}
            className="text-muted-foreground resize-none border-0 bg-transparent px-0 text-lg shadow-none focus-visible:ring-0"
          />
          <MarkdownEditor
            defaultValue={source?.content ?? ''}
            onChange={setContent}
            placeholder={t('contentPlaceholder')}
          />
          {fieldError('content') && <p className="text-destructive text-sm">{fieldError('content')}</p>}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
          {!isOriginal && <p className="text-muted-foreground text-xs">{t('sharedSettings')}</p>}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-category`}>{t('category')}</Label>
            <select
              id={`${formId}-category`}
              name="categoryId"
              defaultValue={previous?.categoryId ?? post?.categoryId ?? ''}
              required
              className="bg-background w-full rounded-md border p-2 text-sm"
            >
              <option value="" disabled>
                {t('categoryPlaceholder')}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            {fieldError('categoryId') && <p className="text-destructive text-sm">{fieldError('categoryId')}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-cover`}>{t('cover')}</Label>
            <Input
              id={`${formId}-cover`}
              name="coverImageUrl"
              type="url"
              defaultValue={previous?.coverImageUrl ?? post?.coverImageUrl ?? ''}
              placeholder="https://"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-tags`}>{t('tags')}</Label>
            <Input
              id={`${formId}-tags`}
              name="tags"
              defaultValue={previous?.tags ?? post?.tags.join(', ') ?? ''}
              placeholder="ai, nextjs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-published`}>{t('publishedAt')}</Label>
            <Input
              id={`${formId}-published`}
              type="datetime-local"
              value={publishedAt}
              onChange={(event) => setPublishedAt(event.target.value)}
            />
          </div>
          <label className="flex items-start justify-between gap-3 rounded-xl border px-4 py-3">
            <span>
              <span className="text-sm font-medium">{t('membersOnly')}</span>
              <span className="text-muted-foreground mt-1 block text-xs">{t('membersOnlyHint')}</span>
            </span>
            <Switch
              name="isMembersOnly"
              value="true"
              defaultChecked={previous ? previous.isMembersOnly === 'true' : (post?.isMembersOnly ?? false)}
            />
          </label>
        </aside>
      </form>
    </div>
  )
}
