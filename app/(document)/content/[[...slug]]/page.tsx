import { notFound } from 'next/navigation'
import Balancer from 'react-wrap-balancer'

import { ContentSidebar } from '@/components/content-sidebar'
import { MDXContentRenderer } from '@/components/mdx/mdx-content-renderer'
import { DashboardTableOfContents } from '@/components/mdx/toc'
import { siteConfig } from '@/config/site.config'
import { getCollections } from '@/lib/collections'
import { absoluteUrl, cn } from '@/lib/utils'

import type { Metadata } from 'next'

type DocPageProps = {
  slug: string[]
}

async function getDocFromParams({ params }: { params: Promise<DocPageProps> }) {
  const parameters = await params
  const slug = '/content/' + parameters.slug?.join('/') || ''

  const { getBySlug } = getCollections()
  return getBySlug(slug)
}

export async function generateMetadata({ params }: { params: Promise<DocPageProps> }): Promise<Metadata> {
  const data = await getDocFromParams({ params })
  const doc = data?.doc
  if (!doc) {
    return {}
  }

  return {
    title: `${doc.title} - ${siteConfig.name}`,
    description: doc.description,
    openGraph: {
      title: doc.title,
      description: doc.description,
      type: 'article',
      url: absoluteUrl(doc.slug),
      images: [
        {
          url: siteConfig.og,
          width: 2880,
          height: 1800,
          alt: siteConfig.name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: doc.title,
      description: doc.description,
      images: [siteConfig.og],
      creator: '@rds_agi'
    }
  }
}

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  const { getParams } = getCollections()
  return getParams()
}

export default async function DocPage({ params }: { params: Promise<DocPageProps> }) {
  const data = await getDocFromParams({ params })

  const doc = data?.doc
  const group = data?.group

  if (!doc || !group) {
    notFound()
  }

  return (
    <div className="flex">
      <ContentSidebar group={group} />
      <article className="relative p-2 md:p-4 lg:gap-10 lg:px-8 lg:py-6 xl:grid xl:grid-cols-[1fr_200px]">
        <div className="mx-auto w-full min-w-0">
          <div className="space-y-2">
            <h1 className={cn('scroll-m-20 text-3xl font-bold tracking-tight')}>{doc.title}</h1>
            {doc && (
              <p className="text-base text-muted-foreground">
                <Balancer>{doc.description}</Balancer>
              </p>
            )}
          </div>
          <div className="pb-12 pt-8">
            <MDXContentRenderer code={doc.body} />
          </div>
        </div>
        <div className="hidden text-sm xl:block">
          <div className="sticky top-16 -mt-10 h-[calc(100vh-3.5rem)] pt-4">
            {doc.toc.visible && <DashboardTableOfContents toc={doc.toc.content} />}
          </div>
        </div>
      </article>
    </div>
  )
}
