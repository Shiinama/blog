'use client'

import { usePathname } from 'next/navigation'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/components/Link'
import { SITE } from 'config/const'
import tagData from 'app/tag-data.json'
import SideBar from '@/components/SideBar'
import CustomNav from '@/components/CustomNav'

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}
interface PaginationProps {
  totalPages: number
  currentPage: number
}
interface ListLayoutProps {
  posts: CoreContent<Blog>[]
  title: string
  initialDisplayPosts?: CoreContent<Blog>[]
  pagination?: PaginationProps
}

function Pagination({ totalPages, currentPage }: PaginationProps) {
  const pathname = usePathname()
  const basePath = pathname.split('/')[1]
  const prevPage = currentPage - 1 > 0
  const nextPage = currentPage + 1 <= totalPages

  return (
    <div className="space-y-2 pb-8 pt-6 md:space-y-5">
      <nav className="flex justify-between">
        {!prevPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!prevPage}>
            Previous
          </button>
        )}
        {prevPage && (
          <Link
            href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
            rel="prev"
          >
            Previous
          </Link>
        )}
        <span>
          {currentPage} of {totalPages}
        </span>
        {!nextPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!nextPage}>
            Next
          </button>
        )}
        {nextPage && (
          <Link href={`/${basePath}/page/${currentPage + 1}`} rel="next">
            Next
          </Link>
        )}
      </nav>
    </div>
  )
}

export default function ListLayoutWithTags({
  posts,
  initialDisplayPosts = [],
  pagination,
}: ListLayoutProps) {
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)

  const displayPosts = initialDisplayPosts.length > 0 ? initialDisplayPosts : posts

  return (
    <div className="flex w-full flex-col px-5 md:w-3/5">
      <CustomNav className="mb-5 mt-10" />
      <div className="flex w-full flex-col md:flex-row">
        <div className="md:3/4 w-full">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {!posts.length && 'No posts found.'}
            {displayPosts.map((post) => {
              const { slug, date, title, summary, author } = post
              return (
                <li key={slug} className="py-6">
                  <article className="hover:text-primary-600">
                    <div>
                      <h2 className="text-2xl font-bold leading-8 tracking-tight ">
                        <Link
                          href={`/blog/${slug}`}
                          className="text-gray-800 hover:text-primary-600 dark:text-gray-100 dark:hover:text-primary-600"
                        >
                          {title}
                        </Link>
                      </h2>
                    </div>
                    <div className="prose mt-2 max-w-none text-gray-400 hover:text-primary-600">
                      {summary}
                    </div>
                    <div className="prose mt-2 text-lg text-gray-400">
                      Posted by {author ?? SITE.author} on{' '}
                      <time dateTime={date}>{formatDate(date)}</time>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
          {pagination && pagination.totalPages > 1 && (
            <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
          )}
        </div>
        <SideBar />
      </div>
    </div>
  )
}
