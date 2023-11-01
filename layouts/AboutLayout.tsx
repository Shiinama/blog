import { ReactNode } from 'react'
import type { About } from 'contentlayer/generated'
import SocialIcon from '@/components/social-icons'
import Image from '@/components/Image'
import SideBar from '@/components/SideBar'
import { SITE, SOCIALS } from 'config/const'

interface Props {
  children: ReactNode
  content: Omit<About, '_id' | '_raw' | 'body'>
}

export default function AboutLayout({ children, content }: Props) {
  const { name, avatar, email, twitter, github } = content

  return (
    <div className="flex w-full flex-col px-5 md:w-3/5 md:flex-row">
      <div className="md:3/4 divide-gray-200dark:divide-gray-700 mx-auto w-full divide-y">
        <div>
          <div
            className="flex flex-col items-center space-x-2 pt-8"
            data-animate
            // @ts-ignore
            style={{ '--stagger': 0 }}
          >
            {avatar && (
              <Image
                src={avatar}
                alt="avatar"
                width={192}
                height={192}
                className="h-48 w-48 rounded-full"
              />
            )}
            <h3 className="pb-2 pt-4 text-2xl font-bold leading-8 tracking-tight">{name}</h3>
            <div className="flex space-x-3 pt-6">
              {SOCIALS &&
                SOCIALS.length > 0 &&
                SOCIALS.map((social, index) => (
                  <SocialIcon key={index} kind={social.name} href={social.href} />
                ))}
            </div>
          </div>
          <div
            className="prose max-w-none pb-8 pt-8 dark:prose-invert xl:col-span-2"
            data-animate
            // @ts-ignore
            style={{ '--stagger': 1 }}
          >
            {children}
          </div>
        </div>
      </div>
      <SideBar className="mt-0 md:mt-24" />
    </div>
  )
}
