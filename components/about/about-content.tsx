'use client'

import { motion } from 'framer-motion'

import { Link } from '@/i18n/navigation'

type ContactLink = {
  name: string
  url: string
}

type AboutSection = {
  title: string
  content: string
}

type AboutContentProps = {
  sections: AboutSection[]
  contactMe: string
  contacts: ContactLink[]
}

export function AboutContent(props: AboutContentProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const { contacts, sections } = props

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto max-w-3xl space-y-10 p-6"
    >
      <motion.section variants={itemVariants}>
        <div className="mb-4 space-y-6">
          {sections.map((section, index) => {
            const Heading = index === 0 ? 'h1' : 'h2'
            const headingClassName =
              index === 0 ? 'text-primary text-3xl font-semibold' : 'text-primary text-2xl font-semibold'

            return (
              <div key={section.title} className="space-y-2">
                <Heading className={headingClassName}>{section.title}</Heading>
                <p className="text-muted-foreground text-base">{section.content}</p>
              </div>
            )
          })}
        </div>
      </motion.section>

      <motion.section variants={itemVariants}>
        <h2 className="text-primary mb-4 text-2xl font-semibold">{props.contactMe}</h2>
        <ul className="space-y-4">
          <li className="text-muted-foreground text-base">Email: xibaoyuxi@gmail.com</li>
          <li className="text-muted-foreground text-base">WeChat: Xibaoyuxi</li>
          {contacts.map((link) => (
            <li key={link.name} className="text-muted-foreground text-base">
              <Link className="hover:text-primary underline transition-colors" href={link.url}>
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </motion.section>
    </motion.div>
  )
}
