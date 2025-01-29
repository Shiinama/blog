'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function About() {
  const t = useTranslations('about')

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const timelineParts = ['timelinePart1', 'timelinePart2', 'timelinePart3'] as const

  type TimelinePart = (typeof timelineParts)[number]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto max-w-3xl space-y-12 p-6"
    >
      <motion.header variants={itemVariants}>
        <h1 className="mb-4 text-2xl font-semibold text-primary">{t('title')}</h1>
        <p className="text-lg text-muted-foreground">{t('intro')}</p>
      </motion.header>

      <motion.section variants={itemVariants}>
        <h2 className="mb-3 text-2xl font-semibold text-primary">{t('workTitle')}</h2>
        <p className="text-base text-muted-foreground">{t('workDescription')}</p>
      </motion.section>

      <motion.section variants={itemVariants}>
        <h2 className="mb-3 text-2xl font-semibold text-primary">{t('lifeTitle')}</h2>
        <p className="text-base text-muted-foreground">{t('lifeDescription')}</p>
      </motion.section>

      <motion.section variants={itemVariants}>
        <h2 className="mb-3 text-2xl font-semibold text-primary">{t('dreamsTitle')}</h2>
        <p className="text-base text-muted-foreground">{t('dreamsDescription')}</p>
      </motion.section>

      <motion.section variants={itemVariants}>
        <h2 className="mb-3 text-2xl font-semibold text-primary">{t('blogPurpose')}</h2>
        <p className="text-base text-muted-foreground">{t('blogPurposeReason')}</p>
      </motion.section>

      <motion.section variants={itemVariants}>
        <h2 className="mb-4 text-2xl font-semibold text-primary">{t('myTimeLine')}</h2>
        <ul className="space-y-4">
          {timelineParts.map((part) => (
            <motion.li key={part} variants={itemVariants} className="rounded-md bg-background p-4 shadow-md">
              <h3 className="text-lg font-medium text-foreground">{t(`${part}Title` as `${TimelinePart}Title`)}</h3>
              <p className="text-base text-muted-foreground">
                {t(`${part}Description` as `${TimelinePart}Description`)}
              </p>
            </motion.li>
          ))}
        </ul>
      </motion.section>

      <motion.section variants={itemVariants}>
        <h2 className="mb-3 text-2xl font-semibold text-primary">{t('contactMe')}</h2>
        <ul className="space-y-2 text-base text-muted-foreground">
          <li>Email: xibaoyuxi@gmail.com</li>
          <li>WeChat: Xibaoyuxi</li>
          {[
            { name: 'Twitter', url: 'https://x.com/Xi_baoyu' },
            { name: 'Github', url: 'https://github.com/Shiinama' },
            { name: 'Juejin', url: 'https://juejin.cn/user/400646714977431' },
            { name: 'Zhihu', url: 'https://www.zhihu.com/people/39-97-11-82' }
          ].map((link) => (
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
