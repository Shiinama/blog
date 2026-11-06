'use client'

import { Button } from '@/components/ui/button'
import { Link, usePathname } from '@/i18n/navigation'

/** Links to the sign-in page, returning to the current page afterwards. */
export function SignInLink({ label, variant = 'ghost' }: { label: string; variant?: 'ghost' | 'default' }) {
  const pathname = usePathname()
  const query = pathname === '/sign-in' ? undefined : { redirectTo: pathname }

  return (
    <Button asChild variant={variant} size="sm">
      <Link href={{ pathname: '/sign-in', query }}>{label}</Link>
    </Button>
  )
}
