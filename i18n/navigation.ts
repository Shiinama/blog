'use client'

import { NavigateOptions } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { createNavigation } from 'next-intl/navigation'
import * as NProgress from 'nprogress'
import { useCallback, useEffect } from 'react'

import { routing } from './routing'

// Lightweight wrappers around Next.js' navigation
// APIs that consider the routing configuration
const { Link, redirect, usePathname, useRouter: UseI18nRouter, getPathname } = createNavigation(routing)

const useRouter = () => {
  const router = UseI18nRouter()
  const pathname = usePathname()
  useEffect(() => {
    NProgress.done()
  }, [pathname])
  const replace = useCallback(
    (href: string, options?: NavigateOptions) => {
      if (href !== pathname) {
        NProgress.start()
      }
      router.replace(href, options)
    },
    [router, pathname]
  )

  const push = useCallback(
    (href: string, options?: NavigateOptions) => {
      if (href !== pathname) {
        NProgress.start()
      }
      router.push(href, options)
    },
    [router, pathname]
  )

  return {
    ...router,
    replace,
    push
  }
}

export { Link, redirect, useRouter, usePathname, getPathname }
