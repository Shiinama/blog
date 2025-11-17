'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { DialogContent, DialogHeader, DialogTitle, Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Button, buttonVariants } from './ui/button'

export function AuthButton() {
  const session = useSession()
  const router = useRouter()
  const t = useTranslations()

  const handleSignInOrOut = () => {
    router.push('/login')
  }

  const user = session.data?.user

  if (session.status === 'unauthenticated')
    return (
      <Button className="px-2 text-sm font-medium" onClick={handleSignInOrOut} variant="link" size="sm">
        {t('common.loginIn')}
      </Button>
    )

  return (
    <div className="flex items-center gap-2">
      {user?.role === 'ADMIN' && (
        <Link
          href="/admin/posts"
          className={buttonVariants({
            className: 'px-2 text-sm font-medium',
            variant: 'link',
            size: 'sm'
          })}
        >
          管理后台
        </Link>
      )}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="px-2 text-sm font-medium" variant="link" size="sm">
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
              <div className="ml-2 capitalize text-muted-foreground">{user?.subscription?.planType}</div>
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
