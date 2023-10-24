import Link from './Link'
import { SITE, SOCIALS } from 'config/const'

export default function Footer() {
  return (
    <footer>
      <div className="mt-16 flex flex-col items-center">
        <div className="mb-3 flex space-x-4">
          {/* TODO */}
          {/* <SocialIcon kind="mail" href={`mailto:${SOCIALS.email}`} size={6} />
          <SocialIcon kind="github" href={SOCIALS.github} size={6} />
          <SocialIcon kind="facebook" href={SOCIALS.facebook} size={6} />
          <SocialIcon kind="youtube" href={SOCIALS.youtube} size={6} />
          <SocialIcon kind="linkedin" href={SOCIALS.linkedin} size={6} />
          <SocialIcon kind="twitter" href={SOCIALS.twitter} size={6} /> */}
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
