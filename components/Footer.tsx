import Link from './Link'
import { SITE, SOCIALS } from 'config/const'
import SocialIcon from '@/components/social-icons'

export default function Footer() {
  return (
    <footer>
      <div className="mt-16 flex flex-col items-center">
        <div className="mb-3 flex space-x-4">
          {SOCIALS &&
            SOCIALS.length > 0 &&
            SOCIALS.map((social, index) => (
              <SocialIcon key={index} kind={social.name} href={social.href} size={6} />
            ))}
        </div>
        <div className="mb-2 flex space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <div>{SITE.author}</div>
          <div>{` • `}</div>
          <div>{`© ${new Date().getFullYear()}`}</div>
          <div>{` • `}</div>
          <Link href="/">{SITE.title}</Link>
        </div>
      </div>
    </footer>
  )
}
