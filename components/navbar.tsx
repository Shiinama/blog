import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

import { AuthButton } from './auth-button'
import LanguageSwitcher from './language-switcher'
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
        'sticky top-0 z-100 flex w-full flex-row items-center px-4 py-1.5 text-sm backdrop-blur-lg md:px-8 md:py-2.5',
        className
      )}
    >
      {!hideLogo && (
        <div className="flex w-full flex-row items-center justify-between">
          {children ? children : <NamedLogoWithLink brandTitle={t('home.brandTitle')} />}
        </div>
      )}
      <div className="ml-auto flex items-center gap-2">
        <Link
          href={'/about'}
          className={buttonVariants({
            variant: 'link',
            size: 'sm',
            className: 'text-sm!'
          })}
        >
          {t('common.about')}
        </Link>
        <AuthButton />
        <ToggleTheme />
        <LanguageSwitcher />
      </div>
    </nav>
  )
}
