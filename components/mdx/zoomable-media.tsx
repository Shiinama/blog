'use client'

import { motion, AnimatePresence, MotionConfig } from 'motion/react'
import Image from 'next/image'
import { useState, useEffect } from 'react'

import { cn } from '@/lib/utils'

export function ZoomableMedia({
  src,
  alt,
  width = 1200,
  height = 400,
  className
}: React.ImgHTMLAttributes<HTMLImageElement> & { width: number; height: number }) {
  const [isZoomed, setIsZoomed] = useState(false)

  const handleZoom = () => {
    setIsZoomed(!isZoomed)
  }

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isZoomed) {
        setIsZoomed(false)
      }
    }

    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isZoomed])

  if (!src || !alt) return

  return (
    <MotionConfig transition={{ duration: 0.3, type: 'spring', bounce: 0 }}>
      <motion.div id="media-container" className={cn('relative my-4 h-auto w-full border', className)}>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="h-full w-full cursor-zoom-in object-contain"
          onClick={handleZoom}
        />
      </motion.div>
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            layout
            layoutRoot
            className="fixed inset-0 z-50 flex h-screen w-screen cursor-zoom-out items-center justify-center bg-black/50 p-4 md:p-8 lg:p-12"
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            onClick={handleZoom}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                className="max-h-full max-w-full object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}
