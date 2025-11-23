import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

import { AuthButton } from './auth-button'
import LanguageSwitcher from './language-switcher'
import { NamedLogoWithLink } from './logo'
import { MobileNav } from './mobile-nav'
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
  const aboutLinkDesktop = (
    <Link
      href={'/about'}
      className={buttonVariants({
        variant: 'link',
        size: 'sm',
        className: 'w-full justify-start whitespace-nowrap px-0 sm:w-auto sm:justify-center sm:px-3'
      })}
    >
      {t('common.about')}
    </Link>
  )

  const aboutLinkMobile = (
    <Link
      href={'/about'}
      className={buttonVariants({
        variant: 'ghost',
        size: 'sm',
        className: 'w-full justify-center rounded-xl py-3 text-base font-semibold shadow-sm'
      })}
    >
      {t('common.about')}
    </Link>
  )

  const menuContentDesktop = (
    <>
      {aboutLinkDesktop}
      <AuthButton />
      <LanguageSwitcher />
      <ToggleTheme className="flex md:flex" />
    </>
  )

  const menuContentMobile = (
    <>
      {aboutLinkMobile}
      <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-2">
        <div className="w-full">
          <AuthButton />
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-background/80 px-3 py-2 shadow-sm ring-1 ring-border/60">
          <LanguageSwitcher />
          <ToggleTheme className="flex md:flex" />
        </div>
      </div>
    </>
  )

  return (
    <nav
      className={cn(
        'sticky top-0 z-100 w-full px-4 py-2 text-sm backdrop-blur supports-[backdrop-filter]:bg-background/85',
        'shadow-[0_1px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_12px_rgba(0,0,0,0.35)]',
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 sm:gap-3">
        <div className="hidden items-center gap-3 sm:flex">
          {!hideLogo && (
            <div className="flex flex-1 items-center gap-3">
              {children ? children : <NamedLogoWithLink brandTitle={t('home.brandTitle')} />}
            </div>
          )}
          <div className="flex items-center gap-1.5">{menuContentDesktop}</div>
        </div>

        <MobileNav
          brand={
            !hideLogo ? (
              children ? (
                children
              ) : (
                <NamedLogoWithLink brandTitle={t('home.brandTitle')} />
              )
            ) : null
          }
          menu={menuContentMobile}
        />
      </div>
    </nav>
  )
}
