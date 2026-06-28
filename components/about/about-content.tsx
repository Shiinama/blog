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
  title: string
  intro: string
  sections: AboutSection[]
  contactMe: string
  contacts: ContactLink[]
}

export function AboutContent(props: AboutContentProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.08 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const { contacts, intro, sections, title } = props
  const buildContentBlocks = (content: string) => {
    const lines = content.split('\n').map((line) => line.trim())
    const blocks: Array<{ type: 'paragraph'; text: string } | { type: 'list'; items: string[] }> = []

    lines.forEach((line) => {
      if (!line) return

      if (line.startsWith('- ')) {
        const item = line.slice(2).trim()
        const lastBlock = blocks[blocks.length - 1]
        if (lastBlock && lastBlock.type === 'list') {
          lastBlock.items.push(item)
        } else {
          blocks.push({ type: 'list', items: [item] })
        }
      } else {
        blocks.push({ type: 'paragraph', text: line })
      }
    })

    return blocks
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-6 lg:pt-16"
    >
      <motion.header variants={itemVariants} className="space-y-4">
        <h1 className="text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <p className="text-muted-foreground max-w-prose whitespace-pre-line text-base leading-relaxed sm:text-lg">
          {intro}
        </p>
      </motion.header>

      <div className="mt-12 flex flex-col">
        {sections.map((section) => {
          const contentBlocks = buildContentBlocks(section.content)

          return (
            <motion.section key={section.title} variants={itemVariants} className="py-9 first:pt-0">
              <h2 className="text-foreground mb-4 text-xl font-semibold">{section.title}</h2>
              <div className="space-y-3">
                {contentBlocks.map((block, blockIndex) =>
                  block.type === 'paragraph' ? (
                    <p
                      key={`${section.title}-paragraph-${blockIndex}`}
                      className="text-foreground/90 max-w-prose text-base leading-relaxed sm:text-lg"
                    >
                      {block.text}
                    </p>
                  ) : (
                    <ul
                      key={`${section.title}-list-${blockIndex}`}
                      className="marker:text-primary/50 text-foreground/90 max-w-prose list-disc space-y-2.5 pl-5 text-base leading-relaxed sm:text-lg"
                    >
                      {block.items.map((item, itemIndex) => (
                        <li key={`${section.title}-list-${blockIndex}-item-${itemIndex}`} className="pl-1">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            </motion.section>
          )
        })}

        <motion.section variants={itemVariants} className="py-9">
          <h2 className="text-foreground mb-5 text-xl font-semibold">{props.contactMe}</h2>
          <dl className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
            <ContactRow label="Email" value="xibaoyuxi@gmail.com" />
            <ContactRow label="WeChat" value="Xibaoyuxi" />
            {contacts.map((link) => (
              <ContactRow key={link.name} label={link.name} href={link.url} />
            ))}
          </dl>
        </motion.section>
      </div>
    </motion.div>
  )
}

function ContactRow({ label, value, href }: { label: string; value?: string; href?: string }) {
  const content = value ?? href

  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground/50 text-[11px] font-medium tracking-[0.12em] uppercase">{label}</dt>
      <dd>
        {href ? (
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-primary text-[15px] font-medium break-all transition-colors"
          >
            {content}
          </Link>
        ) : (
          <span className="text-foreground text-[15px] font-medium break-all select-all">{content}</span>
        )}
      </dd>
    </div>
  )
}
