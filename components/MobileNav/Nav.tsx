'use client'

import { useRef } from 'react'
import { MenuToggle } from './MenuToggle'
import { motion, useCycle } from 'framer-motion'
import { useDimensions } from './use-dimensions'
import { Navigation } from './Navigation'
import Logo from '@/content/logo.svg'

const sidebar = {
  open: (height = 1000) => ({
    clipPath: `circle(${height * 2 + 200}px at calc(100vw - 30px) 40px)`,
    transition: {
      type: 'spring',
      stiffness: 20,
      restDelta: 2,
    },
  }),
  closed: {
    clipPath: 'circle(20px at calc(100vw - 30px) 40px)',
    transition: {
      delay: 0.5,
      type: 'spring',
      stiffness: 400,
      damping: 40,
    },
  },
}

const MobileNav = () => {
  const [isOpen, toggleOpen] = useCycle(false, true)
  const containerRef = useRef(null)
  const { height } = useDimensions(containerRef)
  const onToggleNav = () => {
    if (isOpen) {
      document.body.style.overflow = 'auto'
    } else {
      // Prevent scrolling
      document.body.style.overflow = 'hidden'
    }
    toggleOpen()
  }

  return (
    <>
      <motion.nav
        initial={false}
        custom={height}
        ref={containerRef}
        animate={isOpen ? 'open' : 'closed'}
        className="flex items-center justify-between sm:hidden"
      >
        <motion.div
          className="absolute bottom-0 right-0 top-0 z-40 w-full  bg-white shadow-lg dark:bg-gray-950"
          variants={sidebar}
        >
          <Logo className="absolute left-5 top-5" />
          <Navigation onToggle={onToggleNav} />
        </motion.div>
        <MenuToggle aria-label="Toggle Menu" toggle={() => onToggleNav()} />
      </motion.nav>
    </>
  )
}

export default MobileNav
