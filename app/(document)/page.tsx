import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { blog, business, easyAiTechnology, reactSourceCode, seo, timeline } from '@/.velite'
import Navbar from '@/components/navbar'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Documentation',
  description: 'Manage and view all documentation'
}

export default async function ContentPage() {
  const t = await getTranslations('article')
  const contentTypes = [
    { title: t('timeline'), items: timeline },
    { title: t('life'), items: blog },
    { title: t('seoArticle'), items: seo },
    { title: t('faqAndPath'), items: easyAiTechnology },
    { title: t('reactSourceCode'), items: reactSourceCode },
    { title: t('business'), items: business }
  ]

  return (
    <div className="flex-grow px-5 sm:px-10">
      <Navbar />
      <div className="container grid items-center gap-8">
        {contentTypes.map((contentType) => (
          <div key={contentType.title} className="my-4">
            <h2 className="mb-4 text-3xl font-bold">{contentType.title}</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {contentType.items.map((doc) => (
                <Link href={`${doc.slug}`} key={doc.slug}>
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {doc.title}
                        <span className="ml-2 text-sm text-muted-foreground">
                          {new Date(doc.date).toLocaleDateString()}
                        </span>
                      </CardTitle>
                      <CardDescription className="line-clamp-5">{doc.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
