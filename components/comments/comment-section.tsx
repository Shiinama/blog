'use client'

import { useEffect, useMemo, useState } from 'react'

import { Loader2, MessageCircle, Send, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import type { CommentView } from '@/lib/comments'

type CommentSectionProps = {
  postId: string
  viewerId?: string | null
  initialComments?: CommentView[]
}

export function CommentSection({ postId, viewerId, initialComments }: CommentSectionProps) {
  const t = useTranslations('comments')
  const [comments, setComments] = useState<CommentView[]>(initialComments ?? [])
  const [loading, setLoading] = useState(!initialComments)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [content, setContent] = useState('')

  const initialsCache = useMemo(() => new Map<string, string>(), [])

  useEffect(() => {
    if (initialComments) {
      setComments(initialComments)
      setLoading(false)
    }
  }, [initialComments, postId])

  useEffect(() => {
    if (initialComments?.length) return

    const fetchComments = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`)
        if (!response.ok) {
          throw new Error('Failed to load comments')
        }
        const data = await response.json()
        setComments(data.comments ?? [])
      } catch (error) {
        console.error(error)
        setMessage(t('loadError'))
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [initialComments, postId, t])

  const handleSubmit = async () => {
    if (!viewerId) {
      setMessage(t('signin'))
      return
    }

    const trimmed = content.trim()
    if (!trimmed) {
      setMessage(t('emptyError'))
      return
    }

    setSubmitting(true)
    setMessage(null)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: trimmed })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to post')
      }

      const data = await response.json()
      if (data.comment) {
        setComments((prev) => [data.comment as CommentView, ...prev])
      }
      setContent('')
    } catch (error) {
      console.error(error)
      setMessage(t('submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  const getInitials = (name?: string | null, fallback?: string | null) => {
    const source = name?.trim() || fallback?.trim() || t('anonymous')
    const cached = initialsCache.get(source)
    if (cached) return cached

    const initials = source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2)

    initialsCache.set(source, initials)
    return initials
  }

  const renderTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return timestamp
    }
  }

  return (
    <section className="rounded-3xl bg-card/80 px-4 py-5 shadow-[0_16px_50px_rgba(0,0,0,0.08)] ring-1 ring-border/30 backdrop-blur-sm sm:px-6 dark:ring-white/10">
      <div className="flex items-center gap-3 pb-3">
        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.25em]">{t('title')}</p>
          <p className="text-foreground text-lg font-semibold sm:text-xl">{t('subtitle')}</p>
        </div>
        <span className="text-muted-foreground text-sm font-medium">{t('count', { count: comments.length })}</span>
      </div>

      <div className="space-y-3">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={viewerId ? t('placeholder') : t('signin')}
          disabled={!viewerId || submitting}
          className="min-h-[120px] rounded-2xl border-border/60 bg-muted/30 shadow-inner shadow-black/5"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            {message && (
              <>
                <X className="h-3.5 w-3.5" />
                <span>{message}</span>
              </>
            )}
            {!message && !viewerId && <span>{t('signin')}</span>}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full px-4"
            onClick={handleSubmit}
            disabled={submitting || !viewerId}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="ml-2">{t('submit')}</span>
          </Button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {loading && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loading')}
          </div>
        )}
        {!loading && comments.length === 0 && (
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        )}
        {!loading &&
          comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-2xl bg-card/70 px-4 py-3 shadow-[0_10px_32px_rgba(0,0,0,0.08)] ring-1 ring-border/20 dark:ring-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
                  {getInitials(comment.user.name, comment.user.email)}
                </div>
                <div className="flex-1">
                  <p className="text-foreground text-sm font-semibold leading-tight">
                    {comment.user.name || t('anonymous')}
                  </p>
                  <p className="text-muted-foreground text-xs">{renderTimestamp(comment.createdAt)}</p>
                </div>
              </div>
              <p className="text-foreground/90 mt-2 text-sm leading-relaxed">{comment.content}</p>
            </article>
          ))}
      </div>
    </section>
  )
}
