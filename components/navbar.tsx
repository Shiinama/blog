import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { AuthButton } from './auth-button'
import { NamedLogoWithLink } from './logo'
import ToggleTheme from './toggle'
import { buttonVariants } from './ui/button'

export default async function Navbar({ children }: { children?: React.ReactNode }) {
  const t = await getTranslations()
  return (
    <nav className="sticky top-0 z-50 flex h-16 w-full flex-row items-center justify-between bg-background md:h-20">
      <div className="flex w-full flex-row items-center justify-between">
        {children ? children : <NamedLogoWithLink />}
      </div>
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
    </nav>
  )
}
