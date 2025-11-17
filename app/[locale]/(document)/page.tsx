import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import Navbar from '@/components/navbar'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getVisibleCategoriesWithPosts } from '@/lib/posts'
import { formatCategoryLabel } from '@/lib/categories'

export const metadata = {
  title: 'Documentation',
  description: 'Manage and view all documentation'
}

export default async function ContentPage() {
  const t = await getTranslations('article')
  const categories = await getVisibleCategoriesWithPosts()

  return (
    <div className="grow">
      <Navbar />
      <div className="container grid items-center gap-8 px-5 sm:px-10 md:mt-8">
        {categories
          .filter((category) => category.posts.length > 0)
          .map((category) => {
            const fallbackLabel = formatCategoryLabel(category.key) || 'Uncategorized'
            let label = fallbackLabel
            if (category.key) {
              try {
                label = t(category.key as any)
              } catch {
                label = fallbackLabel
              }
            }
            return (
              <div key={category.id} className="my-4">
                <h2 className="mb-4 text-3xl font-bold">{label}</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {category.posts.map((post) => {
                    const publishedDate = post.publishedAt ?? post.createdAt
                    return (
                      <Link href={`/content/${post.slug}`} key={post.id}>
                        <Card>
                          <CardHeader>
                            <CardTitle>
                              {post.title}
                              {publishedDate && (
                                <span className="text-muted-foreground ml-2 text-sm">
                                  {new Date(publishedDate).toLocaleDateString()}
                                </span>
                              )}
                            </CardTitle>
                            <CardDescription className="line-clamp-5">{post.summary}</CardDescription>
                          </CardHeader>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
