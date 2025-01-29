import { PropsWithChildren } from 'react'

import Navbar from '@/components/navbar'

export default async function PublicLayout({ children }: PropsWithChildren) {
  return (
    <>
      <main className="flex-grow px-5 sm:px-10">
        <Navbar />
        {children}
      </main>
    </>
  )
}
