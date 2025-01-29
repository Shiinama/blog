'use client'

import { motion } from 'framer-motion'
import { Code, Cpu, Globe } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'

export default function Home() {
  const features = [
    { icon: <Code size={40} />, text: 'Advanced AI Programming' },
    { icon: <Cpu size={40} />, text: 'Machine Learning Integration' },
    { icon: <Globe size={40} />, text: 'Natural Language Processing' }
  ]

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 text-center"
      >
        <h1 className="mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-6xl font-extrabold text-transparent">
          Welcome to LinkAI
        </h1>
        <p className="mb-8 text-3xl font-semibold text-gray-700 dark:text-gray-300">
          Your Gateway to Intelligent Conversations
        </p>
      </motion.div>

      <motion.p
        className="z-10 mx-auto mb-12 text-center text-xl text-gray-600 dark:text-gray-400 sm:w-[75%]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        LinkAI AI redefines the chat experience by seamlessly integrating the robust capabilities of OpenAPI. Our
        platform provides developers with a dynamic and intelligent chat companion, enabling easy access to cutting-edge
        AI technologies.
      </motion.p>

      <motion.div
        className="z-10 mb-12 grid grid-cols-1 gap-8 sm:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="mb-4 text-5xl text-blue-600">{feature.icon}</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{feature.text}</h3>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="z-10"
      >
        <Link
          href={'/document'}
          className={buttonVariants({
            size: 'lg',
            className:
              'transform cursor-pointer rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-10 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:from-indigo-700 hover:to-blue-700 hover:shadow-xl'
          })}
        >
          Get started
        </Link>
      </motion.div>
    </div>
  )
}
