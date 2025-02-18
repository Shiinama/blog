'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { CollectionName, getCollections } from '@/lib/collections'

type ContentSidebarProps = {
  group: CollectionName
}

export function ContentSidebar({ group }: ContentSidebarProps) {
  const { byName } = getCollections()
  const t = useTranslations('article')

  const pathname = usePathname()
  const collection = byName[group]

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t(group as any)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {collection
                .sort((a, b) => {
                  const aNum = parseInt(a.title.split('.')[0])
                  const bNum = parseInt(b.title.split('.')[0])
                  return aNum - bNum
                })
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.slug === pathname}>
                      <Link href={item.slug}>
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
