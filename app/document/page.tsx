import Link from 'next/link'

import { blog, seo } from '@/.velite'
import Navbar from '@/components/navbar'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Documentation',
  description: 'Manage and view all documentation'
}

export default function ContentPage() {
  const contentTypes = [
    { title: 'Blog', items: blog },
    { title: 'SEO Articles', items: seo }
  ]

  return (
    <div className="flex-grow px-5 sm:px-10">
      <Navbar />
      <div className="container grid items-center gap-8 pb-12 pt-8 md:py-12">
        <div className="flex max-w-[980px] flex-col items-start gap-4">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tighter md:text-5xl">Documentation</h1>
          <p className="max-w-[700px] text-xl text-muted-foreground">
            Browse our documentation to learn more about our product and services.
          </p>
        </div>
        {contentTypes.map((contentType) => (
          <div key={contentType.title} className="mt-8">
            <h2 className="mb-4 text-3xl font-bold">{contentType.title}</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {contentType.items.map((doc) => (
                <Link href={`/document/${doc.slug}`} key={doc.slug}>
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
