import { PropsWithChildren } from 'react'

import Navbar from '@/components/navbar'

export default async function PublicLayout({ children }: PropsWithChildren) {
  return (
    <>
      <main className="flex-grow">
        <Navbar />
        {children}
      </main>
    </>
  )
}
