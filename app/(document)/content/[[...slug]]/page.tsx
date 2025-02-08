import { notFound } from 'next/navigation'

import { ContentSidebar } from '@/components/content-sidebar'
import { MDXContentRenderer } from '@/components/mdx/mdx-content-renderer'
import { DashboardTableOfContents } from '@/components/mdx/toc'
import Navbar from '@/components/navbar'
import { siteConfig } from '@/config/site.config'
import { getCollections } from '@/lib/collections'
import { absoluteUrl } from '@/lib/utils'

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
    <div className="flex w-full">
      <ContentSidebar group={group} />

      <div className="relative overflow-hidden pt-8 md:overflow-visible md:px-10 md:py-12">
        <Navbar hideLogo className="right-4 top-8 z-20 hidden md:absolute md:right-10 md:top-8 md:flex" />
        <article className="relative flex flex-1 px-4">
          <div className="mx-auto w-full min-w-0">
            <MDXContentRenderer code={doc.body} />
          </div>
          <div className="ml-10 hidden text-sm xl:block">
            <div className="sticky top-24 -mt-10 h-[calc(100vh-3.5rem)] pt-4">
              {doc.toc.visible && <DashboardTableOfContents toc={doc.toc.content} />}
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
