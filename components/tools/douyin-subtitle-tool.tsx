'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

type Segment = { start: number; end: number; text: string }

type SubtitleResult = {
  status: 'succeeded'
  url: string
  language: string
  duration: number | null
  title: string | null
  transcript: string
  segments: Segment[]
  srt: string
  truncated: boolean
}

type PendingResult = { status: 'pending'; runId: string; pollUrl: string }

const API_PATH = '/api/douyin-subtitle'
const POLL_INTERVAL_MS = 5_000
const LANGUAGES = ['zh', 'en', 'ja', 'ko'] as const

function formatDuration(seconds: number | null) {
  if (!seconds || !Number.isFinite(seconds)) return '—'
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function DouyinSubtitleTool() {
  const t = useTranslations('admin.tools.douyinSubtitle')
  const { toast } = useToast()

  const [url, setUrl] = useState('')
  const [lang, setLang] = useState<(typeof LANGUAGES)[number]>('zh')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SubtitleResult | null>(null)

  const activeRef = useRef(true)
  useEffect(() => {
    activeRef.current = true
    return () => {
      activeRef.current = false
    }
  }, [])

  const fail = useCallback(
    (message: string) => {
      toast({ title: t('errorTitle'), description: message, variant: 'destructive' })
    },
    [t, toast]
  )

  const pollUntilDone = useCallback(
    async (pollUrl: string): Promise<SubtitleResult | null> => {
      while (activeRef.current) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
        if (!activeRef.current) return null
        const response = await fetch(pollUrl, { cache: 'no-store' })
        const data = (await response.json().catch(() => null)) as SubtitleResult | PendingResult | { error?: string } | null
        if (!response.ok && response.status !== 202) {
          throw new Error((data as { error?: string })?.error || `HTTP ${response.status}`)
        }
        if (data && 'status' in data && data.status === 'succeeded') {
          return data
        }
        // still pending — keep polling
      }
      return null
    },
    []
  )

  const runExtract = useCallback(
    async () => {
      const trimmed = url.trim()
      if (!trimmed) {
        fail(t('emptyUrl'))
        return
      }

      setLoading(true)
      setResult(null)
      try {
        const response = await fetch(API_PATH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed, targetLanguage: lang })
        })
        const data = (await response.json().catch(() => null)) as
          | SubtitleResult
          | PendingResult
          | { error?: string }
          | null

        if (!response.ok && response.status !== 202) {
          throw new Error((data as { error?: string })?.error || `HTTP ${response.status}`)
        }

        let final: SubtitleResult | null = null
        if (data && 'status' in data && data.status === 'succeeded') {
          final = data
        } else if (data && 'status' in data && data.status === 'pending') {
          final = await pollUntilDone(data.pollUrl)
        }

        if (!activeRef.current) return
        if (!final) {
          fail('No transcript returned.')
          return
        }
        setResult(final)
      } catch (error) {
        if (activeRef.current) fail(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        if (activeRef.current) setLoading(false)
      }
    },
    [url, lang, fail, t, pollUntilDone]
  )

  const copy = useCallback(async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.transcript)
      toast({ title: t('copied') })
    } catch {
      fail(t('copyFailed'))
    }
  }, [result, t, toast, fail])

  const baseName = result?.title?.slice(0, 40).replace(/[\\/:*?"<>|\n]+/g, '_').trim() || 'douyin-subtitle'

  return (
    <div className="space-y-6">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void runExtract()
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="douyin-url">{t('urlLabel')}</Label>
          <Input
            id="douyin-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder={t('urlPlaceholder')}
            autoComplete="off"
            disabled={loading}
          />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="douyin-lang">{t('langLabel')}</Label>
            <Select value={lang} onValueChange={(value) => setLang(value as (typeof LANGUAGES)[number])} disabled={loading}>
              <SelectTrigger id="douyin-lang" className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {t(`lang.${code}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading} className="sm:w-auto">
            {loading ? (
              <>
                <Spinner className="mr-2" />
                {t('extracting')}
              </>
            ) : (
              t('submit')
            )}
          </Button>
        </div>
        {loading && <p className="text-muted-foreground text-sm">{t('pending')}</p>}
      </form>

      {result && (
        <div className="space-y-4">
          <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span>
              {t('metaDuration')}: {formatDuration(result.duration)}
            </span>
            <span>
              {t('metaLanguage')}: {result.language}
            </span>
            <span>
              {t('metaSegments')}: {result.segments.length}
            </span>
          </div>
          {result.title && <p className="text-sm font-medium">{result.title}</p>}
          {result.truncated && <p className="text-destructive text-sm">{t('truncated')}</p>}
          <Textarea readOnly value={result.transcript} rows={16} className="font-mono text-sm" />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={copy}>
              {t('copy')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => download(`${baseName}.txt`, result.transcript, 'text/plain;charset=utf-8')}
            >
              {t('downloadTxt')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!result.srt}
              onClick={() => download(`${baseName}.srt`, result.srt, 'application/x-subrip;charset=utf-8')}
            >
              {t('downloadSrt')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
