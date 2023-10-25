'use client'

import Link from '@/components/Link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const CUSTOM_NAV = [
  {
    title: 'Blog',
    href: '/blog',
  },
  {
    title: 'About',
    href: '/about',
  },
  {
    title: 'Projects',
    href: '/projects',
  },
]
export default function CustomNav({ className }) {
  const pathName = usePathname()

  const classNames = `${className} custom-nav`

  function getClassNames(href) {
    const active =
      href === pathName ||
      (href === '/blog' && pathName === '/') ||
      (href === '/blog' && pathName.startsWith('/blog/page/'))

    return `mr-4 text-3xl  ${
      active ? 'text-primary-700' : ''
    } text-gray-400 hover:text-primary-600 dark:hover:text-primary-400`
  }

  return (
    <div className={classNames}>
      {CUSTOM_NAV.map((item) => (
        <Link href={item.href} key={item.title} className={getClassNames(item.href)}>
          {item.title}
        </Link>
      ))}
    </div>
  )
}
