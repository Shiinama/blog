import Link from 'next/link'

import { requireAdmin } from '@/lib/authz'

import type { PropsWithChildren } from 'react'

export default async function AdminLayout({ children }: PropsWithChildren) {
  const user = await requireAdmin({ redirectTo: '/admin/posts' })

  return (
    <div className="min-h-screen bg-muted/10">
      <header className="border-b bg-background">
        <div className="container flex items-center justify-between py-4">
          <div>
            <p className="text-sm text-muted-foreground">欢迎回来，{user.name ?? user.email}</p>
            <h1 className="text-2xl font-bold">内容管理后台</h1>
          </div>
          <Link href="/" className="text-sm text-primary hover:underline">
            返回首页
          </Link>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  )
}
