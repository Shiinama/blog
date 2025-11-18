'use client'

import { signOut, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { DialogContent, DialogHeader, DialogTitle, Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link, useRouter } from '@/i18n/navigation'

import { Button, buttonVariants } from './ui/button'

export function AuthButton() {
  const session = useSession()
  const router = useRouter()
  const t = useTranslations()

  const handleSignInOrOut = () => {
    router.push('/login')
  }

  const user = session.data?.user
  const isAdmin = ((user ?? {}) as { role?: string }).role === 'ADMIN'
  const planType = ((user ?? {}) as { subscription?: { planType?: string } }).subscription?.planType

  if (session.status === 'unauthenticated')
    return (
      <Button className="text-sm font-medium" onClick={handleSignInOrOut} variant="link" size="sm">
        {t('common.loginIn')}
      </Button>
    )

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Link
          href="/admin/posts"
          className={buttonVariants({
            className: 'text-sm font-medium',
            variant: 'link',
            size: 'sm'
          })}
        >
          {t('common.adminPanel')}
        </Link>
      )}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="text-sm font-medium" variant="link" size="sm">
            {t('common.myAccount')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.myAccount')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-6 pb-4 pt-8">
            <div className="gap-1.5">
              <Label htmlFor="email">{t('common.email')}</Label>
              <Input id="email" disabled value={user?.email ?? ''} />
            </div>
            <div className="gap-1.5">
              <Label htmlFor="username">{t('common.username')}</Label>
              <Input disabled id="username" value={user?.name ?? ''} />
            </div>
            <div className="gap-1.5">
              <Label>{t('common.currentTier')}</Label>
              <div className="ml-2 capitalize text-muted-foreground">{planType}</div>
            </div>
            <Button
              className="w-24 self-end"
              variant="destructive"
              onClick={() => {
                signOut()
              }}
            >
              {t('common.signout')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
