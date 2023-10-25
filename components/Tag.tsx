import Link from 'next/link'
import { slug } from 'github-slugger'
interface Props {
  text: string
}

const Tag = ({ text }: Props) => {
  return (
    <Link
      href={`/tags/${slug(text)}`}
      className="rounded-full border border-[#bfbfbf] px-2 py-1 text-xs font-normal uppercase text-[#bfbfbf] hover:border-primary-600 hover:text-primary-600 dark:border-gray-500 dark:text-gray-500 dark:hover:border-primary-600 dark:hover:text-primary-400"
    >
      {text.split(' ').join('-')}
    </Link>
  )
}

export default Tag
