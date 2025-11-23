'use client'

import { Menu, X } from 'lucide-react'
import { useState } from 'react'

import { usePathname } from '@/i18n/navigation'

import { Button } from './ui/button'

type MobileNavProps = {
  brand?: React.ReactNode
  menu: React.ReactNode
}

export function MobileNav({ brand, menu }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div key={pathname} className="relative w-full sm:hidden">
      <div className="flex items-center gap-3">
        {brand}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          aria-expanded={open}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      <div
        className={`absolute left-0 right-0 pt-2 transition-all duration-150 ${
          open ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
        }`}
      >
        <div className="rounded-2xl border border-border/70 bg-card/95 p-3 shadow-[0_14px_40px_rgba(0,0,0,0.14)] ring-1 ring-black/5 backdrop-blur-md">
          <div className="grid gap-2">{menu}</div>
        </div>
      </div>
    </div>
  )
}
