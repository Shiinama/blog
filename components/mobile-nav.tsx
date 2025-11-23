'use client'

import { Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Link } from '@/i18n/navigation'

import { AuthAccountDialog, AuthLoginDialog } from './auth-actions'
import { useAuthContext } from './auth-provider'
import LanguageSwitcher from './language-switcher'
import { NamedLogoWithLink } from './logo'
import ToggleTheme from './toggle'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const authData = useAuthContext()
  const t = useTranslations()

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <div className="relative w-full sm:hidden">
        <div className="flex items-center gap-3">
          <NamedLogoWithLink brandTitle={t('home.brandTitle')} />
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              aria-expanded={open}
              aria-label={open ? 'Close navigation' : 'Open navigation'}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </DropdownMenuTrigger>
        </div>
        <DropdownMenuContent align="end" sideOffset={12} collisionPadding={8}>
          <DropdownMenuItem>
            <Link href="/about">{t('common.about')}</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem>
            {authData.isAdmin && <Link href="/admin/posts">{authData.common('common.adminPanel')}</Link>}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem>
            {authData.session.status === 'authenticated' ? (
              <AuthAccountDialog variant="menu" />
            ) : (
              <AuthLoginDialog variant="menu" />
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem>
            <LanguageSwitcher variant="menu" />
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem>
            <ToggleTheme variant="menu" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </div>
    </DropdownMenu>
  )
}
