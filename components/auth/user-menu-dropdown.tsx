'use client'

import { LogOut, Shield, User, Wrench } from 'lucide-react'
import Image from 'next/image'

import { signOutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Link } from '@/i18n/navigation'

type Props = {
  name: string
  image: string | null
  isAdmin: boolean
  labels: { account: string; admin: string; tools: string; signOut: string }
}

export function UserMenuDropdown({ name, image, isAdmin, labels }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label={labels.account}>
          {image ? (
            <Image src={image} alt="" width={28} height={28} className="size-7 rounded-full object-cover" />
          ) : (
            <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-full text-xs font-semibold uppercase">
              {name.slice(0, 1)}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <User /> {labels.account}
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/admin/posts">
                <Shield /> {labels.admin}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/tools">
                <Wrench /> {labels.tools}
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOutAction}>
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut className="size-4" /> {labels.signOut}
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
