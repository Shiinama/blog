'use client'

import { Download, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'fish_blog_pwa_dismissed_until'
const DISMISS_MS = 1000 * 60 * 60 * 24 * 3 // 3 days

export function PwaPrompt({ className }: { className?: string }) {
  const t = useTranslations('pwa')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = () => {
      const isIosStandalone = typeof window !== 'undefined' && (window.navigator as any).standalone === true
      setIsStandalone(media.matches || isIosStandalone)
    }
    handleDisplayModeChange()
    media.addEventListener('change', handleDisplayModeChange)
    return () => media.removeEventListener('change', handleDisplayModeChange)
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch((error) => console.error('SW registration failed', error))
  }, [])

  useEffect(() => {
    if (isStandalone) return

    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
    if (dismissedUntil && Date.now() < dismissedUntil) {
      return
    }

    const handleBeforeInstall = (event: Event) => {
      const isSmallScreen = window.matchMedia('(max-width: 960px)').matches
      if (!isSmallScreen) return
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [isStandalone])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setVisible(false)
      return
    }

    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setVisible(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS))
    setVisible(false)
  }

  if (!visible || isStandalone) return null

  return (
    <div
      className={cn(
        'fixed inset-x-3 bottom-4 z-120 sm:inset-x-auto sm:right-6 sm:bottom-6',
        'drop-shadow-2xl',
        className
      )}
    >
      <div className="bg-card/95 ring-border/40 rounded-3xl px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.2)] ring-1 backdrop-blur-md dark:ring-white/15">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary rounded-2xl p-2">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-foreground text-sm font-semibold sm:text-base">{t('title')}</p>
            <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">{t('description')}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button size="sm" className="rounded-full px-3" onClick={handleInstall}>
                {t('cta')}
              </Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={handleDismiss}>
                {t('remindLater')}
              </Button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground mt-1 rounded-full p-1 transition"
            aria-label={t('close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
