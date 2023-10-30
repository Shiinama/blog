import dynamic from 'next/dynamic'

import Logo from '@/content/logo.svg'
import { SITE, SOCIALS } from 'config/const'
import SocialIcon from '@/components/social-icons'

import Link from './Link'
import MobileNav from './MobileNav/Nav'
import ThemeSwitch from './ThemeSwitch'
const SearchButton = dynamic(() => import('./SearchButton'), { ssr: false })

const headerNavLinks = [
  { href: '/', title: 'Home' },
  { href: '/blog', title: 'Blog' },
  { href: '/tags', title: 'Tags' },
  { href: '/projects', title: 'Projects' },
  { href: '/about', title: 'About' },
]

const Header = () => {
  return (
    <>
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
        <div className="flex">
          <div className="mr-5 hidden items-center space-x-4 leading-5 sm:flex sm:space-x-6">
            {headerNavLinks
              .filter((link) => link.href !== '/')
              .map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className="font-medium text-slate-400 hover:text-gray-800 dark:text-slate-300"
                >
                  {link.title}
                </Link>
              ))}
          </div>
          <div className="mr-10 flex items-center space-x-4 sm:mr-0">
            {SOCIALS &&
              SOCIALS.length > 0 &&
              SOCIALS.map((social, index) => (
                <SocialIcon kind={social.name} href={social.href} size={5} />
              ))}
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <MobileNav />
    </>
  )
}

export default Header
