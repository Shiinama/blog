'use client'

import { Mail, Loader2 } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Button } from './ui/button'
import { Input } from './ui/input'

export default function LoginForm() {
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState({
    google: false,
    github: false,
    email: false
  })

  const handleSignIn = async (provider: 'google' | 'github' | 'resend') => {
    setIsLoading((prev) => ({ ...prev, [provider]: true }))
    try {
      await signIn(provider, provider === 'resend' ? { email } : undefined)
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
    } finally {
      setIsLoading((prev) => ({ ...prev, [provider]: false }))
    }
  }

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    handleSignIn('resend')
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() => handleSignIn('google')}
        disabled={isLoading.google}
        className="border-border bg-secondary/10 text-foreground hover:border-foreground/30 w-full rounded-full border px-4 py-3 text-sm font-semibold transition"
      >
        {isLoading.google ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
            <path fill="none" d="M1 1h22v22H1z" />
          </svg>
        )}
        {t('login.google')}
      </Button>

      <Button
        onClick={() => handleSignIn('github')}
        disabled={isLoading.github}
        className="border-border bg-background/40 text-foreground hover:border-foreground/30 w-full rounded-full border px-4 py-3 text-sm font-semibold transition"
      >
        {isLoading.github ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5" fill="currentColor" aria-hidden="true">
            <path d="M12 1C5.92 1 1 5.92 1 12c0 4.86 3.15 8.98 7.52 10.44.55.1.75-.24.75-.53v-1.86c-3.06.67-3.71-1.47-3.71-1.47-.5-1.27-1.22-1.61-1.22-1.61-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.68 2.57 1.2 3.2.91.1-.71.38-1.2.69-1.47-2.44-.28-5.01-1.22-5.01-5.43 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.91 0 0 .92-.3 3.02 1.13a10.5 10.5 0 0 1 2.75-.37c.93 0 1.87.13 2.75.37 2.1-1.43 3.02-1.13 3.02-1.13.6 1.51.22 2.63.11 2.91.7.77 1.13 1.75 1.13 2.95 0 4.22-2.58 5.15-5.03 5.42.4.34.74 1.01.74 2.04v3.02c0 .29.2.64.76.53C19.85 20.98 23 16.86 23 12c0-6.08-4.92-11-11-11z" />
          </svg>
        )}
        {t('login.github')}
      </Button>

      <div className="text-muted-foreground flex justify-center text-xs tracking-[0.35em] uppercase">
        <span>{t('login.orContinue')}</span>
      </div>

      <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3">
        <Input
          type="email"
          placeholder={t('login.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border-border/60 bg-background/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/60 w-full rounded-full border px-4 py-3 text-sm font-medium"
        />
        <Button
          type="submit"
          disabled={isLoading.email}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-full px-4 py-3 text-sm font-semibold transition"
        >
          {isLoading.email ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-5 w-5" />}
          {t('login.emailButton')}
        </Button>
      </form>
    </div>
  )
}
