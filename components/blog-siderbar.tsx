'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { blog, seo } from '@/.velite' // Import other collections as needed
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

type ContentSidebarProps = {
  group: string
}

export function ContentSidebar({ group }: ContentSidebarProps) {
  const pathname = usePathname()

  // Determine the collection based on the group prop
  const collection = group === 'blog' ? blog : seo // Add other conditions as needed

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
                    <Link href={`/document/${item.slug}`}>
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
