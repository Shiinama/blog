'use client'

import { MoonIcon, SunIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ToggleThemeProps = {
  className?: string
  variant?: 'icon' | 'menu'
}

export default function ToggleTheme({ className, variant = 'icon' }: ToggleThemeProps) {
  const { setTheme, theme } = useTheme()
  const t = useTranslations('common')

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  if (variant === 'menu')
    return (
      <Button
        onClick={toggleTheme}
        variant="ghost"
        size="sm"
        className={cn('w-full justify-start px-0 text-sm', className)}
        aria-label={t('toggleTheme')}
      >
        {t('toggleTheme')}
      </Button>
    )

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="sm"
      className={cn('size-9 items-center justify-center', className)}
      aria-label="Toggle theme"
    >
      <SunIcon size={20} className="absolute scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <MoonIcon size={20} className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
