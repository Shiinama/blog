import { FRIENDS } from 'config/const'
import tagData from 'app/tag-data.json'
import Tag from '@/components/Tag'

export default function SideBar({ className }: { className?: string }) {
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  const sortedTags = tagKeys.sort((a, b) => tagCounts[b] - tagCounts[a])

  const classNames = `${className} w-full md:ml-6 md:w-1/4`

  return (
    <div className={classNames}>
      <div
        data-animate
        // @ts-ignore
        style={{ '--stagger': 0 }}
      >
        <div className="mb-6 text-sm font-bold text-[#bfbfbf]">FEATURED TAGS</div>
        {sortedTags.map((t, index) => {
          return (
            <div key={t} className="mb-2 mr-2 inline-block">
              <Tag text={t} />
            </div>
          )
        })}
      </div>
      {FRIENDS && FRIENDS.length > 0 && (
        <div
          className="mt-6 border-t border-gray-200 py-4 dark:border-gray-700"
          data-animate
          // @ts-ignore
          style={{ '--stagger': 2 }}
        >
          <div className="mb-6 text-sm font-bold text-[#bfbfbf]">FRIENDS</div>
          {FRIENDS.map((p) => {
            return (
              <a
                key={p.name}
                href={p.link}
                target="_blank"
                className="mb-2 mr-4  inline-block text-[#bfbfbf] hover:text-primary-600 hover:underline dark:text-gray-500"
              >
                {p.name}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
