import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { cn } from '@/lib/utils'

import { AuthButton } from './auth-button'
import { NamedLogoWithLink } from './logo'
import ToggleTheme from './toggle'
import { buttonVariants } from './ui/button'

export default async function Navbar({
  children,
  hideLogo,
  className
}: {
  children?: React.ReactNode
  hideLogo?: boolean
  className?: string
}) {
  const t = await getTranslations()
  return (
    <nav className={cn('sticky top-0 z-50 flex h-16 w-full flex-row items-center md:h-20', className)}>
      {!hideLogo && (
        <div className="flex w-full flex-row items-center justify-between">
          {children ? children : <NamedLogoWithLink />}
        </div>
      )}
      <div className="ml-auto flex items-center">
        <Link
          href={'/'}
          className={buttonVariants({
            variant: 'link',
            size: 'sm'
          })}
        >
          {t('common.home')}
        </Link>
        <Link
          href={'/about'}
          className={buttonVariants({
            variant: 'link',
            size: 'sm'
          })}
        >
          {t('common.about')}
        </Link>
        <AuthButton />
        <ToggleTheme />
      </div>
    </nav>
  )
}
