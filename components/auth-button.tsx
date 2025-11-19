'use client'

import { signOut, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import LoginForm from '@/components/login-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from '@/i18n/navigation'

import { Button, buttonVariants } from './ui/button'

export function AuthButton() {
  const session = useSession()
  const common = useTranslations()
  const auth = useTranslations('auth')

  const user = session.data?.user
  const isAdmin = process.env.NEXT_PUBLIC_ADMIN_ID?.split(',').includes(user?.id ?? '')
  console.log(process.env.NEXT_PUBLIC_ADMIN_ID, session, user?.id)

  if (session.status === 'unauthenticated')
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="link" size="sm" className="text-sm!">
            {common('common.loginIn')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-foreground text-lg font-semibold">{auth('login.page.title')}</DialogTitle>
            <p className="text-muted-foreground text-xs">{auth('login.page.description')}</p>
          </DialogHeader>
          <LoginForm />
        </DialogContent>
      </Dialog>
    )

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Link
          href="/admin/posts"
          className={buttonVariants({
            variant: 'link',
            size: 'sm',
            className: 'text-sm!'
          })}
        >
          {common('common.adminPanel')}
        </Link>
      )}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="link" size="sm" className="text-sm!">
            {common('common.myAccount')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{common('common.myAccount')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-6 pt-8 pb-4">
            <div className="gap-1.5">
              <Label htmlFor="email">{common('common.email')}</Label>
              <Input id="email" disabled value={user?.email ?? ''} />
            </div>
            <div className="gap-1.5">
              <Label htmlFor="username">{common('common.username')}</Label>
              <Input disabled id="username" value={user?.name ?? ''} />
            </div>
            {/* <div className="gap-1.5">
              <Label>{common('common.currentTier')}</Label>
              <div className="text-muted-foreground ml-2 capitalize">{planType}</div>
            </div> */}
            <Button
              className="w-24 self-end"
              variant="destructive"
              onClick={() => {
                signOut()
              }}
            >
              {common('common.signout')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
