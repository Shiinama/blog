import { ReactNode } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import PageTitle from '@/components/PageTitle'
import SectionContainer from '@/components/SectionContainer'
import Tag from '@/components/Tag'
import ScrollTop from '@/components/ScrollTop'

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

interface LayoutProps {
  content: CoreContent<Blog>
  author: string
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
  children: ReactNode
}

export default function PostLayout({ content, author, next, prev, children }: LayoutProps) {
  const { path, date, title, tags } = content

  return (
    <SectionContainer>
      <ScrollTop />
      <article>
        <div className="w-full xl:divide-y xl:divide-gray-200 xl:dark:divide-gray-700">
          <header className="pt-6 text-center xl:pb-6">
            <div>
              <PageTitle>{title}</PageTitle>
            </div>
            <div>
              <div className="mt-2 text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                <time dateTime={date}>{formatDate(date)}</time>
                &nbsp; by &nbsp;
                {author}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap justify-center">
              {tags.map((t) => (
                <div key={t} className="mb-2 mr-2 inline-block">
                  <Tag text={t} />
                </div>
              ))}
            </div>
          </header>
          <div
            className="prose max-w-none pb-8 pt-10 text-lg dark:prose-invert"
            data-animate
            // @ts-ignore
            style={{ '--stagger': 1 }}
          >
            {children}
          </div>
        </div>
      </article>
    </SectionContainer>
  )
}
