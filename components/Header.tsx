import { SITE } from 'config/const'
import Logo from '@/content/logo.svg'
import Link from './Link'
import MobileNav from './MobileNav'
import ThemeSwitch from './ThemeSwitch'
import SearchButton from './SearchButton'

const headerNavLinks = [
  { href: '/', title: 'Home' },
  { href: '/blog', title: 'Blog' },
  { href: '/tags', title: 'Tags' },
  { href: '/projects', title: 'Projects' },
  { href: '/about', title: 'About' },
]

const Header = () => {
  return (
    <header className="mx-5 flex items-center justify-between py-5">
      <div>
        <Link href="/" aria-label={SITE.headerTitle}>
          <div className="flex items-center justify-between">
            <div className="mr-3">
              <Logo />
            </div>
            {typeof SITE.headerTitle === 'string' ? (
              <div className="hidden h-6 text-2xl font-semibold text-slate-400  dark:text-slate-300 sm:block">
                {SITE.headerTitle}
              </div>
            ) : (
              SITE.headerTitle
            )}
          </div>
        </Link>
      </div>
      <SearchButton />
      <div className="flex items-center space-x-4 leading-5 sm:space-x-6">
        {headerNavLinks
          .filter((link) => link.href !== '/')
          .map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="hidden font-medium text-slate-400 hover:text-gray-800 dark:text-slate-300 sm:block"
            >
              {link.title}
            </Link>
          ))}
        <ThemeSwitch />
        <MobileNav />
      </div>
    </header>
  )
}

export default Header
