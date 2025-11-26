'use client'

import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useRef } from 'react'

import { grantAnnualSubscriptionAction } from '@/actions/subscriptions'
import { initialGrantSubscriptionState } from '@/actions/subscriptions/state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

export function GrantSubscriptionForm() {
  const formRef = useRef<HTMLFormElement | null>(null)
  const t = useTranslations('admin.subscriptions.form')
  const { toast } = useToast()
  const [state, formAction] = useActionState(grantAnnualSubscriptionAction, initialGrantSubscriptionState)

  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: t('successTitle'),
        description: state.message
      })
      formRef.current?.reset()
    } else if (state.status === 'error' && state.message) {
      toast({
        title: t('errorTitle'),
        description: state.message,
        variant: 'destructive'
      })
    }
  }, [state.status, state.message, toast, t])

  const fieldError = (field: string) => state.errors?.[field]?.join(', ')

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userId">{t('userIdLabel')}</Label>
        <Input id="userId" name="userId" type="text" placeholder={t('userIdPlaceholder')} required />
        {fieldError('userId') && <p className="text-destructive text-sm">{fieldError('userId')}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="startAt">{t('startAtLabel')}</Label>
        <Input id="startAt" name="startAt" type="datetime-local" placeholder={t('startAtPlaceholder')} />
        <p className="text-muted-foreground text-sm">{t('startAtHelper')}</p>
        {fieldError('startAt') && <p className="text-destructive text-sm">{fieldError('startAt')}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="note">{t('noteLabel')}</Label>
        <Textarea id="note" name="note" placeholder={t('notePlaceholder')} rows={3} />
        {fieldError('note') && <p className="text-destructive text-sm">{fieldError('note')}</p>}
      </div>
      {state.status === 'error' && !state.errors && state.message && (
        <p className="text-destructive text-sm">{state.message}</p>
      )}
      <Button type="submit" className="w-full sm:w-auto">
        {t('submit')}
      </Button>
    </form>
  )
}
