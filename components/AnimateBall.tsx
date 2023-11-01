'use client'

import { useRef } from 'react'
import Lottie from 'lottie-react'
import animationData from '../lotties/ball.json'
import { motion } from 'framer-motion'

export default function AnimateBall() {
  const constraintsRef = useRef(null)
  return (
    <div className="drag-container">
      <motion.div
        className="drag-area
      "
        ref={constraintsRef}
      />
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
        dragElastic={0.5}
        whileTap={{ cursor: 'grabbing' }}
        className="fixed bottom-0 right-12 h-40 w-40 cursor-pointer md:h-80 md:w-80"
      >
        <Lottie animationData={animationData} loop={true} />
      </motion.div>
    </div>
  )
}
