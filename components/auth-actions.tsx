'use client'

import { signOut } from 'next-auth/react'

import LoginForm from '@/components/login-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

import { useAuthDialogStore } from './auth-dialogs-store'
import { useAuthContext } from './auth-provider'
import { Button, buttonVariants } from './ui/button'

type Variant = 'inline' | 'menu'

const buttonProps = (variant: Variant) => ({
  variant: variant === 'menu' ? ('ghost' as const) : ('link' as const),
  size: 'sm' as const,
  className: cn('text-sm!', variant === 'menu' && 'w-full justify-start px-0')
})

export function AuthAdminLink({ variant }: { variant?: Variant }) {
  const authData = useAuthContext()
  const props = buttonProps(variant ?? 'inline')

  if (!authData.isAdmin) return null

  return (
    <Link
      href="/admin/posts"
      className={buttonVariants({
        variant: props.variant,
        size: 'sm',
        className: props.className
      })}
    >
      {authData.common('common.adminPanel')}
    </Link>
  )
}

export function AuthLoginDialog({ variant }: { variant?: Variant }) {
  const authData = useAuthContext()
  const props = buttonProps(variant ?? 'inline')
  const openLogin = useAuthDialogStore((state) => state.openLogin)

  if (authData.session.status !== 'unauthenticated') return null

  return (
    <Button {...props} onClick={openLogin}>
      {authData.common('common.loginIn')}
    </Button>
  )
}

export function AuthAccountDialog({ variant }: { variant?: Variant }) {
  const authData = useAuthContext()
  const props = buttonProps(variant ?? 'inline')
  const openAccount = useAuthDialogStore((state) => state.openAccount)

  if (authData.session.status !== 'authenticated') return null

  return (
    <Button {...props} onClick={openAccount}>
      {authData.common('common.myAccount')}
    </Button>
  )
}

export function AuthInlineActions() {
  const authData = useAuthContext()

  return (
    <div className="flex items-center gap-2">
      <AuthAdminLink variant="inline" />
      {authData.session.status === 'authenticated' ? (
        <AuthAccountDialog variant="inline" />
      ) : (
        <AuthLoginDialog variant="inline" />
      )}
    </div>
  )
}

export function AuthDialogsHost() {
  const authData = useAuthContext()
  const { loginOpen, accountOpen, closeLogin, closeAccount, openLogin, openAccount } = useAuthDialogStore()

  return (
    <>
      <Dialog open={loginOpen} onOpenChange={(open) => (open ? openLogin() : closeLogin())}>
        <DialogContent>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-foreground text-lg font-semibold">
              {authData.auth('login.page.title')}
            </DialogTitle>
            <p className="text-muted-foreground text-xs">{authData.auth('login.page.description')}</p>
          </DialogHeader>
          <LoginForm />
        </DialogContent>
      </Dialog>

      <Dialog open={accountOpen} onOpenChange={(open) => (open ? openAccount() : closeAccount())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{authData.common('common.myAccount')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-6 pt-8 pb-4">
            <div className="gap-1.5">
              <Label htmlFor="email">{authData.common('common.email')}</Label>
              <Input id="email" disabled value={authData.user?.email ?? ''} />
            </div>
            <div className="gap-1.5">
              <Label htmlFor="username">{authData.common('common.username')}</Label>
              <Input disabled id="username" value={authData.user?.name ?? ''} />
            </div>
            <div className="gap-1.5">
              <Label>{authData.common('common.currentPlan')}</Label>
              <div className="text-muted-foreground ml-2">{authData.planLabel}</div>
            </div>
            <div className="gap-1.5">
              <Label>{authData.common('common.expiresAt')}</Label>
              <div className="text-muted-foreground ml-2">{authData.expiredAtLabel}</div>
            </div>
            <Button
              className="w-24 self-end"
              variant="destructive"
              onClick={() => {
                signOut()
              }}
            >
              {authData.common('common.signout')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
