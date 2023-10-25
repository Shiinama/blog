import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function SectionContainer({ children }: Props) {
  return <section className="mx-auto w-full px-5 md:max-w-3xl md:px-0">{children}</section>
}
