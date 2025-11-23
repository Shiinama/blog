import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

import { AuthInlineActions } from './auth-actions'
import LanguageSwitcher from './language-switcher'
import { NamedLogoWithLink } from './logo'
import { MobileNav } from './mobile-nav'
import ToggleTheme from './toggle'
import { buttonVariants } from './ui/button'

export default async function Navbar({ children, className }: { children?: React.ReactNode; className?: string }) {
  const t = await getTranslations()
  const aboutLinkDesktop = (
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
  )

  const menuContentDesktop = (
    <div className="flex items-center gap-1.5">
      {aboutLinkDesktop}
      <AuthInlineActions />
      <LanguageSwitcher />
      <ToggleTheme className="flex md:flex" />
    </div>
  )

  return (
    <nav
      className={cn(
        'supports-backdrop-filter:bg-background/85 sticky top-0 z-100 w-full px-4 py-2 text-sm backdrop-blur',
        'shadow-[0_1px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_12px_rgba(0,0,0,0.35)]',
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 sm:gap-3">
        <div className="hidden items-center gap-3 sm:flex">
          <div className="flex flex-1 items-center gap-3">
            {children ? children : <NamedLogoWithLink brandTitle={t('home.brandTitle')} />}
          </div>
          {menuContentDesktop}
        </div>

        <MobileNav />
      </div>
    </nav>
  )
}
