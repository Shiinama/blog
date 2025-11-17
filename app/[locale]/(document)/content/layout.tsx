import { PropsWithChildren } from 'react'

import { SidebarProvider } from '@/components/ui/sidebar'

export default async function BlogLayout({ children }: PropsWithChildren) {
  return <SidebarProvider>{children}</SidebarProvider>
}
