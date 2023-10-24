import Link from '@/components/Link'
import { SITE } from 'config/const'

const MAX_DISPLAY = 10

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

export default function Home({ posts }) {
  return (
    <>
      <div className="w-full px-5 md:w-1/2">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {!posts.length && 'No posts found.'}
          {posts.slice(0, MAX_DISPLAY).map((post) => {
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
      </div>
      {posts.length > MAX_DISPLAY && (
        <div className="flex justify-end text-base font-medium leading-6">
          <Link
            href="/blog"
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            aria-label="All posts"
          >
            All Posts &rarr;
          </Link>
        </div>
      )}
    </>
  )
}
