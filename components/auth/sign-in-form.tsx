'use client'

import { Loader2, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { signInWithEmail, signInWithProvider } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { GitHubIcon, GoogleIcon } from './provider-icons'

function SubmitButton({
  children,
  icon,
  variant = 'outline'
}: {
  children: React.ReactNode
  icon: React.ReactNode
  variant?: 'outline' | 'default'
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={variant} className="w-full rounded-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : icon}
      {children}
    </Button>
  )
}

export function SignInForm({ redirectTo }: { redirectTo: string }) {
  const t = useTranslations('signIn')
  const [state, emailAction] = useActionState(signInWithEmail, null)

  return (
    <div className="flex flex-col gap-3">
      <form action={signInWithProvider.bind(null, 'google')}>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <SubmitButton icon={<GoogleIcon />}>{t('google')}</SubmitButton>
      </form>
      <form action={signInWithProvider.bind(null, 'github')}>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <SubmitButton icon={<GitHubIcon />}>{t('github')}</SubmitButton>
      </form>

      <p className="text-muted-foreground py-2 text-center text-xs tracking-[0.3em] uppercase">{t('or')}</p>

      <form action={emailAction} className="flex flex-col gap-3">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <Input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          className="rounded-full"
        />
        {state && !state.ok && <p className="text-destructive text-xs">{t('invalidEmail')}</p>}
        <SubmitButton icon={<Mail />} variant="default">
          {t('email')}
        </SubmitButton>
      </form>
    </div>
  )
}
