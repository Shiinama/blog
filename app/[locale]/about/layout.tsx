import { Metadata } from 'next'
import { PropsWithChildren } from 'react'

import Navbar from '@/components/navbar'

export const metadata: Metadata = {
  title: 'Pricing Plans | CraveU AI',
  description: `Explore CraveU AI's various pricing options. Affordable plans for every user. Choose the perfect plan to suit your needs and get started today.`
}
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
