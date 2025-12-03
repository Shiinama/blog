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
      className="mx-auto max-w-4xl px-4 pt-6 pb-14 sm:px-6"
    >
      <motion.section
        variants={itemVariants}
        className="bg-card/85 ring-border/30 rounded-3xl px-5 py-6 shadow-[0_16px_50px_rgba(0,0,0,0.08)] ring-1 backdrop-blur-sm sm:px-7 dark:ring-white/10"
      >
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Heading = index === 0 ? 'h1' : 'h2'
            const headingClassName =
              index === 0
                ? 'text-foreground text-3xl font-semibold sm:text-4xl'
                : 'text-foreground text-2xl font-semibold'
            const contentBlocks = buildContentBlocks(section.content)

            return (
              <div key={section.title} className="space-y-3">
                <Heading className={headingClassName}>{section.title}</Heading>
                <div className="space-y-2">
                  {contentBlocks.map((block, blockIndex) =>
                    block.type === 'paragraph' ? (
                      <p
                        key={`${section.title}-paragraph-${blockIndex}`}
                        className="text-muted-foreground text-base leading-relaxed sm:text-lg"
                      >
                        {block.text}
                      </p>
                    ) : (
                      <ul
                        key={`${section.title}-list-${blockIndex}`}
                        className="text-muted-foreground list-disc space-y-1 pl-5 text-base leading-relaxed sm:text-lg"
                      >
                        {block.items.map((item, itemIndex) => (
                          <li key={`${section.title}-list-${blockIndex}-item-${itemIndex}`}>{item}</li>
                        ))}
                      </ul>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </motion.section>

      <motion.section
        variants={itemVariants}
        className="from-primary/10 via-card/90 to-card/80 ring-border/30 mt-6 rounded-3xl bg-linear-to-br px-5 py-6 shadow-[0_16px_50px_rgba(0,0,0,0.08)] ring-1 backdrop-blur-sm sm:px-7 dark:ring-white/10"
      >
        <h2 className="text-foreground mb-4 text-2xl font-semibold sm:text-3xl">{props.contactMe}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ContactCard label="Email" value="xibaoyuxi@gmail.com" />
          <ContactCard label="WeChat" value="Xibaoyuxi" />
          {contacts.map((link) => (
            <ContactCard key={link.name} label={link.name} href={link.url} />
          ))}
        </div>
      </motion.section>
    </motion.div>
  )
}

function ContactCard({ label, value, href }: { label: string; value?: string; href?: string }) {
  const content = value ? value : href
  const isLink = Boolean(href)

  return (
    <div className="bg-card/70 ring-border/20 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 dark:ring-white/10">
      <p className="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase">{label}</p>
      {isLink ? (
        <Link
          href={href!}
          className="text-foreground hover:text-primary mt-1 inline-flex items-center gap-2 text-base font-medium transition-colors"
        >
          {content}
        </Link>
      ) : (
        <p className="text-foreground mt-1 text-base font-medium">{content}</p>
      )}
    </div>
  )
}
