'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useToast } from '@/components/ui/use-toast'

type Options = {
  successMessage?: string
  errorMessage?: string
  resetDelay?: number
}

export function useCopyToClipboard({ successMessage, errorMessage, resetDelay = 1500 }: Options = {}) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const copy = useCallback(
    async (text: string) => {
      if (!text) return false
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        if (successMessage) toast({ description: successMessage })
        timerRef.current = setTimeout(() => setCopied(false), resetDelay)
        return true
      } catch (err) {
        console.error('Failed to copy text', err)
        if (errorMessage) toast({ description: errorMessage, variant: 'destructive' })
        return false
      }
    },
    [errorMessage, resetDelay, successMessage, toast]
  )

  return { copied, copy }
}
