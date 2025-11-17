'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator
} from '@/components/ui/sidebar'
import { formatCategoryLabel } from '@/lib/categories'

type SidebarItem = {
  id: string
  title: string
  href: string
}

interface ContentSidebarProps {
  categoryKey?: string | null
  items: SidebarItem[]
}

export function ContentSidebar({ categoryKey, items }: ContentSidebarProps) {
  const t = useTranslations('article')
  const common = useTranslations('common')
  const pathname = usePathname()
  const { setTheme, theme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  let currentCategoryLabel = formatCategoryLabel(categoryKey) || 'Uncategorized'
  if (categoryKey) {
    try {
      const translated = t(categoryKey as any)
      if (translated) {
        currentCategoryLabel = translated
      }
    } catch {
      currentCategoryLabel = formatCategoryLabel(categoryKey) || currentCategoryLabel
    }
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{currentCategoryLabel}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild isActive={item.href === pathname}>
                    <Link href={item.href}>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />

      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/'}>
                <Link href="/">
                  <span>{common('home')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/about'}>
                <Link href="/about">
                  <span>{common('about')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <span onClick={toggleTheme}>切换主题</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </Sidebar>
  )
}
