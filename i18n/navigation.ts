import { createNavigation } from 'next-intl/navigation'

import { routing } from './routing'

const { Link, redirect, usePathname, useRouter: UseI18nRouter, getPathname } = createNavigation(routing)

export { Link, redirect, UseI18nRouter, usePathname, getPathname }
