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
    <nav
      className={cn(
        'sticky top-0 z-50 flex w-full flex-row items-center px-5 py-2 backdrop-blur-lg md:px-10 md:py-4',
        className
      )}
    >
      {!hideLogo && (
        <div className="flex w-full flex-row items-center justify-between">
          {children ? children : <NamedLogoWithLink />}
        </div>
      )}
      <div className="ml-auto flex items-center">
        <Link
          href={'/'}
          className={buttonVariants({
            className: 'md:text-xl',
            variant: 'link',
            size: 'sm'
          })}
        >
          {t('common.home')}
        </Link>
        <Link
          href={'/about'}
          className={buttonVariants({
            className: 'md:text-xl',
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
