import * as React from 'react'
import { motion } from 'framer-motion'
import Link from '../Link'

const variants = {
  open: {
    y: 0,
    opacity: 1,
    transition: {
      y: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    y: 50,
    opacity: 0,
    transition: {
      y: { stiffness: 1000 },
    },
  },
}

export const MenuItem = ({ item, onToggle }) => {
  return (
    <motion.li
      variants={variants}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="mb-10 flex items-center"
    >
      <div className="text-placeholder h-[20px] w-[200px] flex-1 px-5">
        <Link
          href={item.href}
          className="text-xl text-gray-900 dark:text-gray-100"
          onClick={onToggle}
        >
          {item.title}
        </Link>
      </div>
    </motion.li>
  )
}
