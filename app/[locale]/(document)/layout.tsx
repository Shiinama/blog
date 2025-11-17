import { PropsWithChildren } from 'react'

export default async function PublicLayout({ children }: PropsWithChildren) {
  return <main>{children}</main>
}
