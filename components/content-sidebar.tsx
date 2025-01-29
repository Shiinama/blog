'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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

  const pathname = usePathname()
  const collection = byName[group]

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{group.charAt(0).toUpperCase() + group.slice(1)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {collection.map((item) => (
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
