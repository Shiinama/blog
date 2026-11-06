import type { formats } from '@/i18n/request'
import type { routing } from '@/i18n/routing'
import type messages from '@/messages/en.json'

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
    Messages: typeof messages
    Formats: typeof formats
  }
}

declare global {
  /** Chromium's install prompt (not in lib.dom yet). */
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }

  interface Navigator {
    /** iOS Safari: launched from the home screen. */
    readonly standalone?: boolean
  }
}
