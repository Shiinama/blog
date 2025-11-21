'use client'

import { motion } from 'framer-motion'

import { Link } from '@/i18n/navigation'

type TimelineItem = {
  title: string
  description: string
}

type ContactLink = {
  name: string
  url: string
}

type AboutContentProps = {
  title: string
  intro: string
  workTitle: string
  workDescription: string
  lifeTitle: string
  lifeDescription: string
  dreamsTitle: string
  dreamsDescription: string
  myTimeLine: string
  contactMe: string
  timeline: TimelineItem[]
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

  const { timeline, contacts } = props

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto max-w-3xl space-y-12 p-6"
    >
      <motion.header variants={itemVariants}>
        <h1 className="mb-4 text-2xl font-semibold text-primary">{props.title}</h1>
        <p className="text-lg text-muted-foreground">{props.intro}</p>
      </motion.header>

      <motion.section variants={itemVariants}>
        <h2 className="mb-3 text-2xl font-semibold text-primary">{props.workTitle}</h2>
        <p className="text-base text-muted-foreground">{props.workDescription}</p>
      </motion.section>

      <motion.section variants={itemVariants}>
        <h2 className="mb-3 text-2xl font-semibold text-primary">{props.lifeTitle}</h2>
        <p className="text-base text-muted-foreground">{props.lifeDescription}</p>
      </motion.section>

      <motion.section variants={itemVariants}>
        <h2 className="mb-3 text-2xl font-semibold text-primary">{props.dreamsTitle}</h2>
        <p className="text-base text-muted-foreground">{props.dreamsDescription}</p>
      </motion.section>

      <motion.section variants={itemVariants}>
        <h2 className="mb-4 text-2xl font-semibold text-primary">{props.myTimeLine}</h2>
        <ul className="space-y-4">
          {timeline.map((part) => (
            <motion.li key={part.title} variants={itemVariants} className="rounded-md bg-background p-4 shadow-md">
              <h3 className="text-lg font-medium text-foreground">{part.title}</h3>
              <p className="text-base text-muted-foreground">{part.description}</p>
            </motion.li>
          ))}
        </ul>
      </motion.section>

      <motion.section variants={itemVariants}>
        <h2 className="mb-3 text-2xl font-semibold text-primary">{props.contactMe}</h2>
        <ul className="space-y-2 text-base text-muted-foreground">
          <li>Email: xibaoyuxi@gmail.com</li>
          <li>WeChat: Xibaoyuxi</li>
          {contacts.map((link) => (
            <li key={link.name}>
              <Link className="underline transition-colors hover:text-primary" href={link.url}>
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </motion.section>
    </motion.div>
  )
}
