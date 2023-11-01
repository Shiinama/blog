'use client'

import Lottie from 'lottie-react'
import animationData from '../lotties/ball.json'

export default function AnimateBall() {
  return (
    <div className="fixed bottom-0 right-0 h-40 w-40  cursor-pointer md:h-80 md:w-80">
      <Lottie animationData={animationData} loop={true} />
    </div>
  )
}
