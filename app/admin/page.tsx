import { redirect } from '@/i18n/navigation'
import { DEFAULT_LOCALE } from '@/i18n/routing'

export default function AdminIndex() {
  redirect({ href: '/admin/posts', locale: DEFAULT_LOCALE })
}
