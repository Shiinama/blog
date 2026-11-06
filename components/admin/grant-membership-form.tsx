'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState } from 'react'
import { toast } from 'sonner'

import { grantMembership } from '@/actions/memberships'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function GrantMembershipForm() {
  const t = useTranslations('admin.memberships.grant')
  const tErrors = useTranslations('actions.errors')
  const [state, formAction, isPending] = useActionState<Awaited<ReturnType<typeof grantMembership>>, FormData>(
    async (previous, formData) => {
      const result = await grantMembership(previous, formData)
      if (result?.ok) toast.success(t('success'))
      else if (result) toast.error(tErrors(result.error))
      return result
    },
    null
  )
  const previous = state?.ok === false ? state.values : undefined

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="userId">{t('userId')}</Label>
        <Input
          id="userId"
          name="userId"
          defaultValue={previous?.userId}
          required
          placeholder={t('userIdPlaceholder')}
          className="font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="startsAt">{t('startsAt')}</Label>
        <Input id="startsAt" name="startsAt" type="date" defaultValue={previous?.startsAt} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="months">{t('months')}</Label>
        <Input id="months" name="months" type="number" min={1} max={36} defaultValue={previous?.months ?? 12} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="note">{t('note')}</Label>
        <Input id="note" name="note" defaultValue={previous?.note} maxLength={200} placeholder={t('notePlaceholder')} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {t('submit')}
        </Button>
      </div>
    </form>
  )
}
