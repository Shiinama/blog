import * as React from 'react'
import { motion } from 'framer-motion'
import { MenuItem } from './MenuItem'

const variants = {
  open: {
    transition: { staggerChildren: 0.07, delayChildren: 0.2 },
  },
  closed: {
    transition: { staggerChildren: 0.05, staggerDirection: -1 },
  },
}

export const Navigation = ({ onToggle }) => (
  <motion.ul variants={variants} className="absolute top-20 h-full  p-2 ">
    {headerNavLinks.map((item, index) => (
      <MenuItem item={item} key={index} onToggle={onToggle} />
    ))}
  </motion.ul>
)

const headerNavLinks = [
  { href: '/', title: 'Home' },
  { href: '/blog', title: 'Blog' },
  { href: '/tags', title: 'Tags' },
  { href: '/projects', title: 'Projects' },
  { href: '/about', title: 'About' },
]
